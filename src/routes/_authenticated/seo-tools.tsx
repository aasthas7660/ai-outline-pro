import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ToolRunner, renderSEO, seoToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/seo-tools")({
  head: () => ({ meta: [{ title: "SEO Tools — OutlineCraft AI" }] }),
  component: SeoToolsPage,
});

function SeoToolsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">SEO Tools</h1>
        <p className="text-muted-foreground mt-1">Generate a complete SEO brief for any topic — keywords, intent, score, slug and meta tags.</p>
      </header>

      <ToolRunner
        toolType="seo_analysis"
        title="SEO Analyzer"
        description="Primary, secondary, long-tail and semantic keywords + intent, score, word count, URL slug, and meta tags."
        icon={Search}
        showAudience
        topicLabel="Blog topic or target query"
        topicPlaceholder="e.g. How to choose a CRM for a 10-person sales team"
        renderResult={renderSEO}
        toMarkdown={seoToMarkdown}
      />
    </div>
  );
}
