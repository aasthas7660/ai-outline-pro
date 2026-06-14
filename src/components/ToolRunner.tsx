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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Copy, Star, RefreshCw, Loader2 } from "lucide-react";
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
