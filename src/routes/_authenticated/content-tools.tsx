import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Type, Anchor, Megaphone, FileText, HelpCircle, Table as TableIcon } from "lucide-react";
import {
  ToolRunner,
  renderTitles, titlesToMarkdown,
  renderHooks, hooksToMarkdown,
  renderCTAs, ctasToMarkdown,
  renderSummary, summaryToMarkdown,
  renderFAQs, faqsToMarkdown,
  renderTable, tableToMarkdown,
} from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/content-tools")({
  head: () => ({ meta: [{ title: "Content Tools — OutlineCraft AI" }] }),
  component: ContentToolsPage,
});

function ContentToolsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Content Tools</h1>
        <p className="text-muted-foreground mt-1">Generate titles, hooks, CTAs, summaries, FAQs and tables in seconds.</p>
      </header>

      <Tabs defaultValue="titles" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="titles"><Type className="mr-1.5 h-4 w-4" />Titles</TabsTrigger>
          <TabsTrigger value="hooks"><Anchor className="mr-1.5 h-4 w-4" />Hooks</TabsTrigger>
          <TabsTrigger value="cta"><Megaphone className="mr-1.5 h-4 w-4" />CTAs</TabsTrigger>
          <TabsTrigger value="summary"><FileText className="mr-1.5 h-4 w-4" />Summary</TabsTrigger>
          <TabsTrigger value="faq"><HelpCircle className="mr-1.5 h-4 w-4" />FAQs</TabsTrigger>
          <TabsTrigger value="table"><TableIcon className="mr-1.5 h-4 w-4" />Tables</TabsTrigger>
        </TabsList>

        <TabsContent value="titles">
          <ToolRunner toolType="title_generator" title="Blog Title Generator" icon={Type}
            description="10 SEO-friendly title variations." showTone showAudience
            renderResult={renderTitles} toMarkdown={titlesToMarkdown} />
        </TabsContent>
        <TabsContent value="hooks">
          <ToolRunner toolType="hook_generator" title="Hook Generator" icon={Anchor}
            description="Question, story, curiosity and statistic hooks." showAudience
            renderResult={renderHooks} toMarkdown={hooksToMarkdown} />
        </TabsContent>
        <TabsContent value="cta">
          <ToolRunner toolType="cta_generator" title="Call-To-Action Generator" icon={Megaphone}
            description="Soft, strong and newsletter CTAs." showAudience
            renderResult={renderCTAs} toMarkdown={ctasToMarkdown} />
        </TabsContent>
        <TabsContent value="summary">
          <ToolRunner toolType="summary_generator" title="Summary Generator" icon={FileText}
            description="Short paragraph, bullet summary, and key takeaways."
            topicLabel="Topic or paste content" topicPlaceholder="Paste an article or describe a topic to summarize…"
            renderResult={renderSummary} toMarkdown={summaryToMarkdown} />
        </TabsContent>
        <TabsContent value="faq">
          <ToolRunner toolType="faq_generator" title="FAQ Generator" icon={HelpCircle}
            description="Generate 8 relevant FAQs with answers." showAudience
            renderResult={renderFAQs} toMarkdown={faqsToMarkdown} />
        </TabsContent>
        <TabsContent value="table">
          <ToolRunner toolType="table_generator" title="Table Generator" icon={TableIcon}
            description="Comparison or informational tables."
            topicLabel="What should the table compare or describe?"
            topicPlaceholder="e.g. Compare Notion vs ClickUp vs Asana for product teams"
            renderResult={renderTable} toMarkdown={tableToMarkdown} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
