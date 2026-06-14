import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { ToolRunner, renderBrief, briefToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/content-brief")({
  head: () => ({ meta: [{ title: "Content Brief Generator — OutlineCraft AI" }] }),
  component: ContentBriefPage,
});

function ContentBriefPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Content Brief Generator</h1>
        <p className="text-muted-foreground mt-1">Surfer/Frase-style briefs before you start writing.</p>
      </header>
      <ToolRunner
        toolType="content_brief"
        title="Generate content brief"
        icon={ClipboardList}
        description="Intent, structure, keywords, references, and writing guidelines."
        topicLabel="Blog topic"
        topicPlaceholder="e.g. How to start a SaaS newsletter"
        extraLabel="Primary keyword & length (optional)"
        extraPlaceholder="e.g. Primary keyword: saas newsletter. Length: Long (2000+ words)."
        extraRows={3}
        showTone
        showAudience
        renderResult={renderBrief}
        toMarkdown={briefToMarkdown}
      />
    </div>
  );
}
