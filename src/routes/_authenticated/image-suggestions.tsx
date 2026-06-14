import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon } from "lucide-react";
import { ToolRunner, renderImages, imagesToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/image-suggestions")({
  head: () => ({ meta: [{ title: "Image Suggestions — OutlineCraft AI" }] }),
  component: ImageSuggestionsPage,
});

function ImageSuggestionsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Image Suggestions</h1>
        <p className="text-muted-foreground mt-1">Find the right visuals for every section of your article, with SEO alt text.</p>
      </header>
      <ToolRunner
        toolType="image_suggestions"
        title="Generate image ideas"
        icon={ImageIcon}
        description="Suggested images, featured image and social thumbnail with alt text."
        topicLabel="Blog topic"
        topicPlaceholder="e.g. Beginner's guide to container gardening"
        extraLabel="Article outline (optional)"
        extraPlaceholder="Paste your H2 headings or full outline so suggestions match the structure…"
        extraRows={5}
        renderResult={renderImages}
        toMarkdown={imagesToMarkdown}
      />
    </div>
  );
}
