import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { ToolRunner, renderGap, gapToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/content-gap")({
  head: () => ({ meta: [{ title: "Content Gap Analyzer — OutlineCraft AI" }] }),
  component: ContentGapPage,
});

function ContentGapPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Content Gap Analyzer</h1>
        <p className="text-muted-foreground mt-1">Paste an article and see what's missing vs. top-ranking content.</p>
      </header>
      <ToolRunner
        toolType="content_gap"
        title="Analyze content gaps"
        icon={GitCompareArrows}
        description="Missing headings, subtopics, FAQs, keywords and an overall content score."
        topicLabel="Target topic / primary keyword"
        topicPlaceholder="e.g. Best running shoes for flat feet"
        extraLabel="Existing article content"
        extraPlaceholder="Paste the full article you want to audit…"
        extraRows={10}
        renderResult={renderGap}
        toMarkdown={gapToMarkdown}
      />
    </div>
  );
}
