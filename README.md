# 🤖 Takumi

**Takumi** is an open-source, AI-powered meeting assistant platform built with the modern web stack. It bridges the gap between real-time video conferencing and intelligent post-meeting analysis.

With Takumi, users can create custom **AI Agents** with specific personas/instructions, invite them to meetings, and interact with them afterward to query transcripts, summaries, and action items.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🚀 Features

- **📹 Real-time Video Meetings:** High-quality video calls powered by **Stream Video**.
- **🤖 Custom AI Agents:** Create agents with unique personalities and instructions (e.g., "Note Taker", "Technical Reviewer").
- **📝 Automated Transcription & Summarization:** Meetings are automatically transcribed and summarized using **OpenAI** and **Inngest**.
- **💬 Interactive AI Chat:** Chat with your AI agents *after* the meeting. They have full context of the transcript and can answer specific questions about what happened.
- **🔐 Secure Authentication:** Built-in auth using **Better Auth**.
- **💸 Subscription Ready:** Integrated with **Polar** for managing premium features and subscriptions.
- **⚡ Reactive UI:** Built with **Shadcn UI**, **Tailwind CSS**, and **React 19**.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (via [Neon](https://neon.tech/))
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Video & Chat:** [Stream](https://getstream.io/)
- **AI & LLMs:** [OpenAI](https://openai.com/)
- **Background Jobs:** [Inngest](https://www.inngest.com/)
- **Authentication:** [Better Auth](https://www.better-auth.com/)
- **Payments:** [Polar](https://polar.sh/)
- **API Layer:** [tRPC](https://trpc.io/)

---

## ⚡ Getting Started

Follow these steps to get Takumi running locally on your machine.

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **pnpm**
- **PostgreSQL Database** (We recommend Neon Serverless)

### 1. Clone the Repository

```bash
git clone [https://github.com/vasanthrs-dev/takumi.git](https://github.com/vasanthrs-dev/takumi.git)
cd takumi

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory. You will need credentials from the services listed in the tech stack.

```env
# Database (Neon/Postgres)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Stream (Video & Chat)
NEXT_PUBLIC_STREAM_VIDEO_API_KEY="your_stream_api_key"
STREAM_VIDEO_SECRET_KEY="your_stream_secret_key"

# OpenAI (AI Summarization & Chat)
OPENAI_API_KEY="sk-..."

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:3000"

# Payments (Polar)
POLAR_ACCESS_TOKEN="your_polar_access_token"

# Inngest (Background Jobs)
INNGEST_EVENT_KEY="local" # Optional for local dev
INNGEST_SIGNING_KEY="local" # Optional for local dev

```

### 4. Database Setup

Push the database schema to your PostgreSQL instance using Drizzle.

```bash
npm run db:push

```

### 5. Run the Application

You need to run the development server and the Inngest dev server (for handling background workflows like summarization).

**Terminal 1: Next.js App**

```bash
npm run dev

```

**Terminal 2: Inngest Dev Server**

```bash
npx inngest-cli@latest dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to see the app.
Open [http://localhost:8288](https://www.google.com/search?q=http://localhost:8288) to see the Inngest dashboard.

---

## 🔄 Architecture Overview

### The Meeting Lifecycle

1. **Creation:** A user creates a meeting and assigns an **Agent** to it.
2. **Live Session:** The user joins the video call powered by Stream. The session is recorded.
3. **Processing:** Once the meeting ends, a webhook triggers an **Inngest** function.
* The system fetches the transcript.
* It identifies speakers (Users vs. Agents).
* It uses OpenAI to generate a structured summary.


4. **Interaction:** The user can visit the meeting detail page and chat. The chat messages are processed by an Inngest function that feeds the meeting summary + agent instructions to OpenAI to generate a response.

---

## 📂 Project Structure

```text
src/
├── app/              # Next.js App Router pages (auth, dashboard, call)
├── components/       # Reusable UI components (Shadcn)
├── db/               # Drizzle schema and connection logic
├── inngest/          # Background job definitions (AI processing)
├── lib/              # Utility libraries (Stream, OpenAI, Utils)
├── modules/          # Feature-based architecture
│   ├── agents/       # Agent management logic
│   ├── auth/         # Authentication views
│   ├── call/         # Video call UI & logic
│   ├── dashboard/    # Dashboard layout & components
│   ├── meetings/     # Meeting management & transcripts
│   └── premium/      # Polar subscription logic
└── trpc/             # tRPC API definition

```

---

## 🤝 Contributing

We love contributions! Takumi is open source and built for the community.

1. **Fork** the repository.
2. Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4. **Push** to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

### Development Scripts

* `npm run dev`: Start the dev server.
* `npm run db:studio`: Open Drizzle Studio to view your database data visually.
* `npm run dev:webhook`: Start an ngrok tunnel (useful for testing Stream webhooks locally).

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it as you wish.
