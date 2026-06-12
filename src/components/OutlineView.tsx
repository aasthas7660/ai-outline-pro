import type { OutlineContent } from "@/lib/outline-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OutlineView({ content }: { content: OutlineContent }) {
  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-3xl gradient-text">{content.h1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Introduction</p>
          <p className="text-foreground/90 leading-relaxed">{content.introduction}</p>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader><CardTitle>Structure</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {content.sections.map((s, i) => (
            <div key={i} className="border-l-2 border-primary/40 pl-4">
              <h3 className="font-display text-lg font-semibold">{i + 1}. {s.h2}</h3>
              <ul className="mt-2 space-y-1">
                {s.h3.map((h, j) => (
                  <li key={j} className="text-sm text-muted-foreground">— {h}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="surface-card">
          <CardHeader><CardTitle>Key Takeaways</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.key_takeaways.map((k, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="text-primary">✓</span> {k}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader><CardTitle>Related Topics</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {content.related_topics.map((t, i) => (
              <Badge key={i} variant="secondary">{t}</Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="surface-card">
        <CardHeader><CardTitle>Conclusion</CardTitle></CardHeader>
        <CardContent><p className="leading-relaxed">{content.conclusion}</p></CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {content.faqs.map((f, i) => (
            <div key={i}>
              <p className="font-semibold">{f.question}</p>
              <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function outlineToMarkdown(c: OutlineContent): string {
  const lines: string[] = [];
  lines.push(`# ${c.h1}`, "", "## Introduction", c.introduction, "");
  c.sections.forEach((s) => {
    lines.push(`## ${s.h2}`);
    s.h3.forEach((h) => lines.push(`### ${h}`));
    lines.push("");
  });
  lines.push("## Conclusion", c.conclusion, "", "## Key Takeaways");
  c.key_takeaways.forEach((k) => lines.push(`- ${k}`));
  lines.push("", "## Related Topics");
  c.related_topics.forEach((t) => lines.push(`- ${t}`));
  lines.push("", "## FAQs");
  c.faqs.forEach((f) => lines.push(`### ${f.question}`, f.answer, ""));
  return lines.join("\n");
}
