import { createFileRoute } from "@tanstack/react-router";
import { Code2 } from "lucide-react";
import { ToolRunner, renderSchema, schemaToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/schema-generator")({
  head: () => ({ meta: [{ title: "Schema Generator — OutlineCraft AI" }] }),
  component: SchemaPage,
});

function SchemaPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Schema Generator</h1>
        <p className="text-muted-foreground mt-1">Generate FAQ, Article and Breadcrumb JSON-LD ready to paste into your &lt;head&gt;.</p>
      </header>
      <ToolRunner
        toolType="schema_generator"
        title="Generate JSON-LD"
        description="Produces three Schema.org blocks for your article."
        icon={Code2}
        topicLabel="Article topic or title"
        topicPlaceholder="e.g. The complete guide to keyword research"
        renderResult={renderSchema}
        toMarkdown={schemaToMarkdown}
      />
    </div>
  );
}
