import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { createAgent, openai, TextMessage } from "@inngest/agent-kit";
import { streamChat } from "@/lib/stream-chat";
import OpenAI from "openai";
import { generatedAvatarUri } from "@/lib/avatar";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const summarizer = createAgent({
  name: "summarizer",
  system: `
  You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z`.trim(),
  model: openai({
    model: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
  }),
});

export const meetingProcessing = inngest.createFunction(
  { id: "meetings/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    const response = await step.run("fetch_transcript", async () => {
      const res = await fetch(event.data.transcriptUrl);
      if (!res.ok) throw new Error("Failed to download transcript");
      return res.text();
    });

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];

      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((user) =>
          user.map((user) => ({
            ...user,
          }))
        );

      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
          }))
        );

      const speakers = [...userSpeakers, ...agentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );

        if (!speaker) {
          return {
            ...item,
            user: {
              name: "Unknown",
            },
          };
        }

        return {
          ...item,
          user: {
            name: speaker.name,
          },
        };
      });
    });

    const { output } = await summarizer.run(
      "Summarize the following transcript: " +
        JSON.stringify(transcriptWithSpeakers)
    );

    await step.run("save-summary", async () => {
      await db
        .update(meetings)
        .set({
          summary: (output[0] as TextMessage).content as string,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId));
    });
  }
);

export const processChatMessage = inngest.createFunction(
  { id: "process-chat-message" },
  { event: "chat/process_message" },
  async ({ event, step }) => {
    const { userId, channelId, text, agentId, meetingId } = event.data;

    // 1. Fetch Data (You can re-fetch to be safe, or pass details in event)
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId));

    // 2. Prepare Context
    const instructions = `
        You are an AI assistant helping the user revisit a recently completed meeting.
      Below is a summary of the meeting, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
      
      ${existingAgent.instructions}
      
      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.
      
      You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
    `;

    // 3. Get Chat History
    // Optimization: Use .query() instead of .watch() for backend logic (faster)
    const channel = streamChat.channel("messaging", channelId);
    const messagesResult = await channel.query({
      messages: { limit: 5 },
    });

    const previousMessages = messagesResult.messages
      .filter((msg) => msg.text && msg.text.trim() !== "")
      .map((message) => ({
        role: message.user?.id === existingAgent.id ? "assistant" : "user",
        content: message.text || "",
      }));

    // 4. Call OpenAI
    const GPTResponse = await openaiClient.chat.completions.create({
      messages: [
        { role: "system", content: instructions },
        ...(previousMessages as any), // Type casting might be needed depending on SDK version
        { role: "user", content: text },
      ],
      model: "gpt-4o-mini",
    });

    const responseText = GPTResponse.choices[0].message.content;
    if (!responseText) return;

    // 5. Send Reply
    const avatarUrl = generatedAvatarUri({
      seed: existingAgent.name,
      variant: "botttsNeutral",
    });

    await streamChat.upsertUser({
      id: existingAgent.id,
      name: existingAgent.name,
      image: avatarUrl,
    });

    await channel.sendMessage({
      text: responseText,
      user: {
        id: existingAgent.id,
        name: existingAgent.name,
        image: avatarUrl,
      },
    });
  }
);
