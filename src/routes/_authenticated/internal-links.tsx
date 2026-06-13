import { createFileRoute } from "@tanstack/react-router";
import { Link as LinkIcon } from "lucide-react";
import { ToolRunner, renderInternalLinks, internalLinksToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/internal-links")({
  head: () => ({ meta: [{ title: "Internal Links — OutlineCraft AI" }] }),
  component: InternalLinksPage,
});

function InternalLinksPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Internal Links &amp; References</h1>
        <p className="text-muted-foreground mt-1">Anchor text suggestions, related article ideas, and authoritative external sources.</p>
      </header>
      <ToolRunner
        toolType="internal_links"
        title="Suggest links"
        description="Get anchor texts, related-article ideas and external references for your topic."
        icon={LinkIcon}
        topicLabel="Blog topic"
        topicPlaceholder="e.g. On-page SEO best practices for 2026"
        renderResult={renderInternalLinks}
        toMarkdown={internalLinksToMarkdown}
      />
    </div>
  );
}
