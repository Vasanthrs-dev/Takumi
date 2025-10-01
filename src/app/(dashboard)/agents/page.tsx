import {
  AgentsViewError,
  AgentsViewLoading,
  AgentView,
} from "@/modules/agents/ui/views/agents-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

const Page = async () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());
  return (
    <HydrationBoundary>
      <Suspense fallback={<AgentsViewLoading />}>
        <ErrorBoundary fallback={<AgentsViewError />}>
          <AgentView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
