import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { ToolRunner, renderCalendar, calendarToMarkdown } from "@/components/ToolRunner";

export const Route = createFileRoute("/_authenticated/content-calendar")({
  head: () => ({ meta: [{ title: "Content Calendar — OutlineCraft AI" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Content Calendar</h1>
        <p className="text-muted-foreground mt-1">Plan weekly + monthly content with a recurring publishing schedule.</p>
      </header>
      <ToolRunner
        toolType="content_calendar"
        title="Generate a calendar"
        description="Weekly plan, monthly themes, and publishing slots."
        icon={CalendarDays}
        showAudience
        topicLabel="Niche or theme"
        topicPlaceholder="e.g. B2B SaaS marketing for early-stage founders"
        renderResult={renderCalendar}
        toMarkdown={calendarToMarkdown}
      />
    </div>
  );
}
