import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { runTool, type ToolType } from "@/lib/tools.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Copy, Star, RefreshCw } from "lucide-react";
import { LottieIcon } from "@/components/LottieIcon";


import { toast } from "sonner";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export function ToolRunner({
  toolType,
  title,
  description,
  icon: Icon = Sparkles,
  showTone = false,
  showAudience = false,
  topicLabel = "Topic",
  topicPlaceholder = "e.g. Best CRMs for small sales teams",
  extraLabel,
  extraPlaceholder,
  extraRows = 4,
  renderResult,
  toMarkdown,
}: {
  toolType: ToolType;
  title: string;
  description: string;
  icon?: typeof Sparkles;
  showTone?: boolean;
  showAudience?: boolean;
  topicLabel?: string;
  topicPlaceholder?: string;
  extraLabel?: string;
  extraPlaceholder?: string;
  extraRows?: number;
  renderResult: (out: JsonValue) => React.ReactNode;
  toMarkdown: (out: JsonValue) => string;
}) {
  const run = useServerFn(runTool);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("General");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState<{ id: string; output: JsonValue } | null>(null);

  const mut = useMutation({
    mutationFn: () =>
      run({
        data: {
          tool_type: toolType,
          topic,
          tone: showTone ? tone : undefined,
          audience: showAudience ? audience : undefined,
          language: "English",
          extra: extra.trim() ? extra.trim().slice(0, 2000) : undefined,
        },
      }),
    onSuccess: (d) => {
      setResult({ id: d.id, output: d.output as JsonValue });
      toast.success("Generated!");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 2) return toast.error("Please enter a topic");
    mut.mutate();
  };


  const onCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(toMarkdown(result.output));
    toast.success("Copied");
  };

  const onSave = async () => {
    if (!result) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("tool_results").update({ saved: true }).eq("id", result.id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>{topicLabel}</Label>
            <Textarea rows={2} placeholder={topicPlaceholder} value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={500} />
          </div>
          {extraLabel && (
            <div className="space-y-2">
              <Label>{extraLabel}</Label>
              <Textarea rows={extraRows} placeholder={extraPlaceholder} value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={2000} />
            </div>
          )}

          {(showTone || showAudience) && (
            <div className="grid grid-cols-2 gap-3">
              {showTone && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Tone</Label>
                  <Input value={tone} onChange={(e) => setTone(e.target.value)} />
                </div>
              )}
              {showAudience && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Audience</Label>
                  <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
            {result && (
              <>
                <Button type="button" variant="outline" onClick={() => mut.mutate()} disabled={mut.isPending}>
                  <RefreshCw className="mr-2 h-4 w-4" />Regenerate
                </Button>
                <Button type="button" variant="outline" onClick={onCopy}><Copy className="mr-2 h-4 w-4" />Copy</Button>
                <Button type="button" variant="outline" onClick={onSave}><Star className="mr-2 h-4 w-4" />Save</Button>
              </>
            )}
          </div>
        </form>

        {mut.isPending && (
          <div className="space-y-2 pt-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {!mut.isPending && result && (
          <div className="pt-3 border-t border-border/60">{renderResult(result.output)}</div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Renderers & markdown helpers ---------------- */

function asObj(v: JsonValue): Record<string, JsonValue> {
  return (v && typeof v === "object" && !Array.isArray(v) ? v : {}) as Record<string, JsonValue>;
}
function asArr(v: JsonValue | undefined): JsonValue[] {
  return Array.isArray(v) ? v : [];
}
function asStr(v: JsonValue | undefined): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export function ListBlock({ label, items }: { label: string; items: JsonValue[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => <Badge key={i} variant="secondary" className="text-sm">{asStr(it)}</Badge>)}
      </div>
    </div>
  );
}

export function BulletBlock({ label, items }: { label: string; items: JsonValue[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-primary mt-0.5">•</span>{asStr(it)}</li>)}
      </ul>
    </div>
  );
}

/* SEO renderer */
export function renderSEO(out: JsonValue) {
  const o = asObj(out);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="SEO Score" value={`${asStr(o.seo_score) || "—"}/100`} />
        <Stat label="Word Count" value={asStr(o.recommended_word_count) || "—"} />
        <Stat label="Intent" value={asStr(o.search_intent) || "—"} />
      </div>
      <KV label="Primary keyword" value={asStr(o.primary_keyword)} />
      <KV label="URL slug" value={asStr(o.url_slug)} mono />
      <KV label="Meta title" value={asStr(o.meta_title)} />
      <KV label="Meta description" value={asStr(o.meta_description)} />
      <ListBlock label="Secondary keywords" items={asArr(o.secondary_keywords)} />
      <ListBlock label="Long-tail keywords" items={asArr(o.long_tail_keywords)} />
      <ListBlock label="Semantic keywords" items={asArr(o.semantic_keywords)} />
    </div>
  );
}
export function seoToMarkdown(out: JsonValue) {
  const o = asObj(out);
  return [
    `# SEO Brief`,
    `**Primary keyword:** ${asStr(o.primary_keyword)}`,
    `**Search intent:** ${asStr(o.search_intent)}`,
    `**SEO score:** ${asStr(o.seo_score)}/100`,
    `**Recommended word count:** ${asStr(o.recommended_word_count)}`,
    `**URL slug:** ${asStr(o.url_slug)}`,
    `**Meta title:** ${asStr(o.meta_title)}`,
    `**Meta description:** ${asStr(o.meta_description)}`,
    ``,
    `## Secondary`, ...asArr(o.secondary_keywords).map((x) => `- ${asStr(x)}`),
    ``, `## Long-tail`, ...asArr(o.long_tail_keywords).map((x) => `- ${asStr(x)}`),
    ``, `## Semantic`, ...asArr(o.semantic_keywords).map((x) => `- ${asStr(x)}`),
  ].join("\n");
}

/* Titles */
export function renderTitles(out: JsonValue) {
  const items = asArr(asObj(out).titles);
  return <BulletBlock label="Titles" items={items} />;
}
export const titlesToMarkdown = (out: JsonValue) =>
  asArr(asObj(out).titles).map((t, i) => `${i + 1}. ${asStr(t)}`).join("\n");

/* Hooks */
export function renderHooks(out: JsonValue) {
  const o = asObj(out);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <BulletBlock label="Question hooks" items={asArr(o.question_hooks)} />
      <BulletBlock label="Story hooks" items={asArr(o.story_hooks)} />
      <BulletBlock label="Curiosity hooks" items={asArr(o.curiosity_hooks)} />
      <BulletBlock label="Statistic hooks" items={asArr(o.statistic_hooks)} />
    </div>
  );
}
export const hooksToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const block = (k: string, arr: JsonValue[]) => [`## ${k}`, ...arr.map((x) => `- ${asStr(x)}`), ""].join("\n");
  return [
    block("Question hooks", asArr(o.question_hooks)),
    block("Story hooks", asArr(o.story_hooks)),
    block("Curiosity hooks", asArr(o.curiosity_hooks)),
    block("Statistic hooks", asArr(o.statistic_hooks)),
  ].join("\n");
};

/* CTA */
export function renderCTAs(out: JsonValue) {
  const o = asObj(out);
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <BulletBlock label="Soft CTA" items={asArr(o.soft_cta)} />
      <BulletBlock label="Strong CTA" items={asArr(o.strong_cta)} />
      <BulletBlock label="Newsletter CTA" items={asArr(o.newsletter_cta)} />
    </div>
  );
}
export const ctasToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const block = (k: string, arr: JsonValue[]) => [`## ${k}`, ...arr.map((x) => `- ${asStr(x)}`), ""].join("\n");
  return [
    block("Soft CTA", asArr(o.soft_cta)),
    block("Strong CTA", asArr(o.strong_cta)),
    block("Newsletter CTA", asArr(o.newsletter_cta)),
  ].join("\n");
};

/* Summary */
export function renderSummary(out: JsonValue) {
  const o = asObj(out);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Short summary</p>
        <p className="text-sm leading-relaxed">{asStr(o.short_summary)}</p>
      </div>
      <BulletBlock label="Bullet summary" items={asArr(o.bullet_summary)} />
      <BulletBlock label="Key takeaways" items={asArr(o.key_takeaways)} />
    </div>
  );
}
export const summaryToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  return [
    `## Short summary`, asStr(o.short_summary), ``,
    `## Bullet summary`, ...asArr(o.bullet_summary).map((x) => `- ${asStr(x)}`), ``,
    `## Key takeaways`, ...asArr(o.key_takeaways).map((x) => `- ${asStr(x)}`),
  ].join("\n");
};

/* FAQ */
export function renderFAQs(out: JsonValue) {
  const items = asArr(asObj(out).faqs);
  return (
    <div className="space-y-4">
      {items.map((raw, i) => {
        const f = asObj(raw);
        return (
          <div key={i} className="border-l-2 border-primary/40 pl-4">
            <p className="font-semibold">{asStr(f.question)}</p>
            <p className="text-sm text-muted-foreground mt-1">{asStr(f.answer)}</p>
          </div>
        );
      })}
    </div>
  );
}
export const faqsToMarkdown = (out: JsonValue) =>
  asArr(asObj(out).faqs).map((raw) => {
    const f = asObj(raw);
    return `### ${asStr(f.question)}\n${asStr(f.answer)}\n`;
  }).join("\n");

/* Table */
export function renderTable(out: JsonValue) {
  const o = asObj(out);
  const cols = asArr(o.columns).map(asStr);
  const rows = asArr(o.rows).map((r) => asArr(r).map(asStr));
  return (
    <div className="space-y-3">
      <p className="font-display text-lg">{asStr(o.title)} <span className="text-xs text-muted-foreground ml-2">({asStr(o.type)})</span></p>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>{cols.map((c, i) => <TableHead key={i}>{c}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>{r.map((cell, j) => <TableCell key={j}>{cell}</TableCell>)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
export const tableToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const cols = asArr(o.columns).map(asStr);
  const rows = asArr(o.rows).map((r) => asArr(r).map(asStr));
  const head = `| ${cols.join(" | ")} |`;
  const sep = `| ${cols.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return [`## ${asStr(o.title)}`, head, sep, body].join("\n");
};

/* Competitor Analysis */
export function renderCompetitor(out: JsonValue) {
  const o = asObj(out);
  const snips = asArr(o.snippet_opportunities).map(asObj);
  return (
    <div className="space-y-5">
      <BulletBlock label="Competitor headings" items={asArr(o.competitor_headings)} />
      <BulletBlock label="Missing sections (your opportunities)" items={asArr(o.missing_sections)} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured snippet opportunities</p>
        <div className="grid gap-3 md:grid-cols-2">
          {snips.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase">{asStr(s.type)}</Badge>
                <p className="font-medium text-sm">{asStr(s.query)}</p>
              </div>
              <p className="text-xs text-muted-foreground">{asStr(s.suggested_answer)}</p>
            </div>
          ))}
        </div>
      </div>
      <BulletBlock label="People also ask" items={asArr(o.people_also_ask)} />
    </div>
  );
}
export const competitorToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const block = (k: string, arr: JsonValue[]) => [`## ${k}`, ...arr.map((x) => `- ${asStr(x)}`), ""].join("\n");
  const snips = asArr(o.snippet_opportunities).map(asObj);
  return [
    block("Competitor headings", asArr(o.competitor_headings)),
    block("Missing sections", asArr(o.missing_sections)),
    `## Featured snippet opportunities`,
    ...snips.map((s) => `- (${asStr(s.type)}) ${asStr(s.query)} — ${asStr(s.suggested_answer)}`),
    ``,
    block("People also ask", asArr(o.people_also_ask)),
  ].join("\n");
};

/* Schema Generator */
function JsonBlock({ label, value }: { label: string; value: JsonValue }) {
  const text = JSON.stringify(value, null, 2);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Button type="button" size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(text); toast.success("Copied"); }}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />Copy JSON-LD
        </Button>
      </div>
      <pre className="overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed font-mono max-h-80">{text}</pre>
    </div>
  );
}
export function renderSchema(out: JsonValue) {
  const o = asObj(out);
  return (
    <div className="space-y-5">
      <JsonBlock label="FAQ Schema" value={o.faq_schema ?? {}} />
      <JsonBlock label="Article Schema" value={o.article_schema ?? {}} />
      <JsonBlock label="Breadcrumb Schema" value={o.breadcrumb_schema ?? {}} />
    </div>
  );
}
export const schemaToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const wrap = (label: string, v: JsonValue) =>
    ["```json", `// ${label}`, JSON.stringify(v ?? {}, null, 2), "```", ""].join("\n");
  return [wrap("FAQ Schema", o.faq_schema), wrap("Article Schema", o.article_schema), wrap("Breadcrumb Schema", o.breadcrumb_schema)].join("\n");
};

/* Internal Links / External References */
export function renderInternalLinks(out: JsonValue) {
  const o = asObj(out);
  const related = asArr(o.related_articles).map(asObj);
  const refs = asArr(o.external_references).map(asObj);
  return (
    <div className="space-y-5">
      <ListBlock label="Suggested anchor texts" items={asArr(o.anchor_texts)} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related article ideas</p>
        <div className="grid gap-2 md:grid-cols-2">
          {related.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium text-sm">{asStr(r.title)}</p>
              <p className="text-xs text-muted-foreground mt-1">{asStr(r.reason)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authoritative external references</p>
        <ul className="space-y-2">
          {refs.map((r, i) => (
            <li key={i} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm">{asStr(r.title)}</p>
                <a className="text-xs text-primary hover:underline truncate" href={asStr(r.url)} target="_blank" rel="noreferrer">{asStr(r.url)}</a>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{asStr(r.why)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
export const internalLinksToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const related = asArr(o.related_articles).map(asObj);
  const refs = asArr(o.external_references).map(asObj);
  return [
    `## Anchor texts`, ...asArr(o.anchor_texts).map((x) => `- ${asStr(x)}`), ``,
    `## Related articles`, ...related.map((r) => `- **${asStr(r.title)}** — ${asStr(r.reason)}`), ``,
    `## External references`, ...refs.map((r) => `- [${asStr(r.title)}](${asStr(r.url)}) — ${asStr(r.why)}`),
  ].join("\n");
};

/* Content Calendar */
export function renderCalendar(out: JsonValue) {
  const o = asObj(out);
  const weekly = asArr(o.weekly).map(asObj);
  const monthly = asArr(o.monthly).map(asObj);
  const sched = asArr(o.publishing_schedule).map(asObj);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Weekly plan</p>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>Day</TableHead><TableHead>Title</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
            <TableBody>
              {weekly.map((w, i) => (
                <TableRow key={i}><TableCell className="font-medium">{asStr(w.day)}</TableCell><TableCell>{asStr(w.title)}</TableCell><TableCell><Badge variant="secondary">{asStr(w.type)}</Badge></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Monthly plan</p>
        <div className="grid gap-3 md:grid-cols-2">
          {monthly.map((m, i) => {
            const posts = asArr(m.posts).map(asObj);
            return (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-semibold">{asStr(m.week)} — <span className="text-muted-foreground font-normal">{asStr(m.theme)}</span></p>
                <ul className="mt-2 space-y-1">
                  {posts.map((p, j) => (
                    <li key={j} className="text-sm flex justify-between gap-2">
                      <span>{asStr(p.title)}</span>
                      <Badge variant="outline" className="text-[10px]">{asStr(p.type)}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Publishing schedule</p>
        <div className="flex flex-wrap gap-2">
          {sched.map((s, i) => (
            <Badge key={i} variant="secondary" className="text-sm">{asStr(s.day)} · {asStr(s.time)} · {asStr(s.channel)}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
export const calendarToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const weekly = asArr(o.weekly).map(asObj);
  const monthly = asArr(o.monthly).map(asObj);
  const sched = asArr(o.publishing_schedule).map(asObj);
  return [
    `## Weekly plan`,
    ...weekly.map((w) => `- **${asStr(w.day)}** — ${asStr(w.title)} _(${asStr(w.type)})_`),
    ``,
    `## Monthly plan`,
    ...monthly.flatMap((m) => [
      `### ${asStr(m.week)} — ${asStr(m.theme)}`,
      ...asArr(m.posts).map(asObj).map((p) => `- ${asStr(p.title)} _(${asStr(p.type)})_`),
      ``,
    ]),
    `## Publishing schedule`,
    ...sched.map((s) => `- ${asStr(s.day)} · ${asStr(s.time)} · ${asStr(s.channel)}`),
  ].join("\n");
};

/* Image Suggestions */
function ImageCard({ s }: { s: Record<string, JsonValue> }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-sm">{asStr(s.image_title) || asStr(s.title)}</p>
        <Badge variant="secondary" className="text-[10px] uppercase shrink-0">{asStr(s.image_type) || asStr(s.type)}</Badge>
      </div>
      {asStr(s.section_name) && <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{asStr(s.section_name)}</p>}
      <p className="text-sm text-muted-foreground">{asStr(s.image_description) || asStr(s.description)}</p>
      <p className="text-xs"><span className="font-semibold text-muted-foreground">Alt:</span> <span className="italic">{asStr(s.alt_text)}</span></p>
    </div>
  );
}
export function renderImages(out: JsonValue) {
  const o = asObj(out);
  const sections = asArr(o.sections).map(asObj);
  const featured = asObj(o.featured_image);
  const social = asObj(o.social_thumbnail);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Featured image</p>
          <ImageCard s={featured} />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social thumbnail</p>
          <ImageCard s={social} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Section images</p>
        <div className="grid gap-3 md:grid-cols-2">
          {sections.map((s, i) => <ImageCard key={i} s={s} />)}
        </div>
      </div>
    </div>
  );
}
export const imagesToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const f = asObj(o.featured_image);
  const s = asObj(o.social_thumbnail);
  const sections = asArr(o.sections).map(asObj);
  const fmt = (x: Record<string, JsonValue>) =>
    `- **${asStr(x.image_title) || asStr(x.title)}** _(${asStr(x.image_type) || asStr(x.type)})_\n  ${asStr(x.image_description) || asStr(x.description)}\n  Alt: ${asStr(x.alt_text)}`;
  return [
    `## Featured image`, fmt(f), ``,
    `## Social thumbnail`, fmt(s), ``,
    `## Section images`, ...sections.map((x) => `### ${asStr(x.section_name)}\n${fmt(x)}`),
  ].join("\n");
};

/* Content Gap */


function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}/100</span></div>
      <Progress value={Math.max(0, Math.min(100, value))} />
    </div>
  );
}
export function renderGap(out: JsonValue) {
  const o = asObj(out);
  const score = Number(o.content_score) || 0;
  const seo = Number(o.seo_coverage) || 0;
  const topic = Number(o.topic_coverage) || 0;
  const kw = asObj(o.missing_keywords);
  const rec = asObj(o.recommendations);
  const faqs = asArr(o.missing_faqs).map(asObj);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Content Score</p>
          <p className="font-display text-4xl mt-1">{score}<span className="text-base text-muted-foreground">/100</span></p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"><ScoreBar label="SEO coverage" value={seo} /><ScoreBar label="Topic coverage" value={topic} /></div>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Quick wins</p>
          <p className="text-sm">{asArr(o.missing_headings).length} missing headings · {asArr(o.missing_subtopics).length} subtopics · {faqs.length} FAQs</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <BulletBlock label="Missing headings" items={asArr(o.missing_headings)} />
        <BulletBlock label="Missing subtopics" items={asArr(o.missing_subtopics)} />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <ListBlock label="Primary keywords" items={asArr(kw.primary)} />
        <ListBlock label="Secondary keywords" items={asArr(kw.secondary)} />
        <ListBlock label="Semantic keywords" items={asArr(kw.semantic)} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing FAQs</p>
        {faqs.map((f, i) => (
          <div key={i} className="border-l-2 border-primary/40 pl-4">
            <p className="font-semibold text-sm">{asStr(f.question)}</p>
            <p className="text-xs text-muted-foreground mt-1">{asStr(f.answer)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <BulletBlock label="Thin sections" items={asArr(rec.thin_sections)} />
        <BulletBlock label="Expand opportunities" items={asArr(rec.expand_opportunities)} />
        <BulletBlock label="Better explanations" items={asArr(rec.better_explanations)} />
        <BulletBlock label="Readability" items={asArr(rec.readability)} />
      </div>
    </div>
  );
}
export const gapToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const kw = asObj(o.missing_keywords);
  const rec = asObj(o.recommendations);
  const b = (k: string, arr: JsonValue[]) => [`## ${k}`, ...arr.map((x) => `- ${asStr(x)}`), ""].join("\n");
  return [
    `# Content Gap Analysis`,
    `**Score:** ${asStr(o.content_score)}/100 · SEO ${asStr(o.seo_coverage)} · Topic ${asStr(o.topic_coverage)}`, ``,
    b("Missing headings", asArr(o.missing_headings)),
    b("Missing subtopics", asArr(o.missing_subtopics)),
    b("Primary keywords", asArr(kw.primary)),
    b("Secondary keywords", asArr(kw.secondary)),
    b("Semantic keywords", asArr(kw.semantic)),
    `## Missing FAQs`,
    ...asArr(o.missing_faqs).map(asObj).map((f) => `### ${asStr(f.question)}\n${asStr(f.answer)}\n`),
    b("Thin sections", asArr(rec.thin_sections)),
    b("Expand opportunities", asArr(rec.expand_opportunities)),
    b("Better explanations", asArr(rec.better_explanations)),
    b("Readability", asArr(rec.readability)),
  ].join("\n");
};

/* Content Brief */
export function renderBrief(out: JsonValue) {
  const o = asObj(out);
  const structure = asObj(o.structure);
  const sections = asArr(structure.sections).map(asObj);
  const kw = asObj(o.keywords);
  const guide = asObj(o.writing_guidelines);
  const internal = asArr(o.internal_links).map(asObj);
  const refs = asArr(o.external_references).map(asObj);
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Intent" value={asStr(o.search_intent) || "—"} />
        <Stat label="Word count" value={asStr(o.word_count) || "—"} />
        <Stat label="Primary KW" value={asStr(o.primary_keyword) || asStr(kw.primary) || "—"} />
        <Stat label="Audience" value={asStr(o.target_audience).slice(0, 24) || "—"} />
      </div>
      <KV label="Content goal" value={asStr(o.content_goal)} />
      <KV label="Target audience" value={asStr(o.target_audience)} />
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested structure</p>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="font-display text-lg">H1 — {asStr(structure.h1)}</p>
          <ul className="space-y-2">
            {sections.map((s, i) => (
              <li key={i}>
                <p className="font-medium text-sm">H2 — {asStr(s.h2)}</p>
                <ul className="ml-4 mt-1 space-y-0.5">
                  {asArr(s.h3).map((h, j) => <li key={j} className="text-xs text-muted-foreground">H3 — {asStr(h)}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <BulletBlock label="Important questions" items={asArr(o.important_questions)} />
        <BulletBlock label="Important topics" items={asArr(o.important_topics)} />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <ListBlock label="Secondary keywords" items={asArr(kw.secondary)} />
        <ListBlock label="Long-tail" items={asArr(kw.long_tail)} />
        <ListBlock label="Semantic" items={asArr(kw.semantic)} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internal link ideas</p>
          {internal.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium text-sm">{asStr(r.title)}</p>
              <p className="text-xs text-muted-foreground mt-1">{asStr(r.reason)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External references</p>
          {refs.map((r, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex justify-between gap-3 items-center">
                <p className="font-medium text-sm">{asStr(r.title)}</p>
                <a href={asStr(r.url)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate">{asStr(r.url)}</a>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{asStr(r.why)}</p>
            </div>
          ))}
        </div>
      </div>
      <BulletBlock label="Key takeaways" items={asArr(o.key_takeaways)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <KV label="Tone" value={asStr(guide.tone)} />
        <KV label="Reading level" value={asStr(guide.reading_level)} />
        <KV label="Formatting" value={asStr(guide.formatting)} />
      </div>
    </div>
  );
}
export const briefToMarkdown = (out: JsonValue) => {
  const o = asObj(out);
  const structure = asObj(o.structure);
  const sections = asArr(structure.sections).map(asObj);
  const kw = asObj(o.keywords);
  const guide = asObj(o.writing_guidelines);
  return [
    `# Content Brief`,
    `**Primary keyword:** ${asStr(o.primary_keyword) || asStr(kw.primary)}`,
    `**Search intent:** ${asStr(o.search_intent)} · **Word count:** ${asStr(o.word_count)}`,
    `**Audience:** ${asStr(o.target_audience)}`,
    `**Goal:** ${asStr(o.content_goal)}`,
    ``, `## Structure`, `H1: ${asStr(structure.h1)}`,
    ...sections.flatMap((s) => [`- H2: ${asStr(s.h2)}`, ...asArr(s.h3).map((h) => `  - H3: ${asStr(h)}`)]),
    ``, `## Important questions`, ...asArr(o.important_questions).map((x) => `- ${asStr(x)}`),
    ``, `## Important topics`, ...asArr(o.important_topics).map((x) => `- ${asStr(x)}`),
    ``, `## Keywords`,
    `- Secondary: ${asArr(kw.secondary).map(asStr).join(", ")}`,
    `- Long-tail: ${asArr(kw.long_tail).map(asStr).join(", ")}`,
    `- Semantic: ${asArr(kw.semantic).map(asStr).join(", ")}`,
    ``, `## Key takeaways`, ...asArr(o.key_takeaways).map((x) => `- ${asStr(x)}`),
    ``, `## Writing guidelines`,
    `- Tone: ${asStr(guide.tone)}`,
    `- Reading level: ${asStr(guide.reading_level)}`,
    `- Formatting: ${asStr(guide.formatting)}`,
  ].join("\n");
};


/* ----- small helpers ----- */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl">{value}</p>
    </div>
  );
}
function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm" : "text-sm"}>{value || "—"}</p>
    </div>
  );
}
