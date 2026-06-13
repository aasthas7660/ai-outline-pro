import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { ToolRunner, renderCompetitor, competitorToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/competitor-analysis")({
  head: () => ({ meta: [{ title: "Competitor Analysis — OutlineCraft AI" }] }),
  component: CompetitorPage,
});

function CompetitorPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Competitor Analysis</h1>
        <p className="text-muted-foreground mt-1">See competitor headings, missing sections, featured snippet wins and People Also Ask.</p>
      </header>
      <ToolRunner
        toolType="competitor_analysis"
        title="Analyze a topic"
        description="Reverse-engineer the SERP for a topic and find gaps to exploit."
        icon={Users}
        showAudience
        topicLabel="Blog topic"
        topicPlaceholder="e.g. Best email marketing tools for startups"
        renderResult={renderCompetitor}
        toMarkdown={competitorToMarkdown}
      />
    </div>
  );
}
