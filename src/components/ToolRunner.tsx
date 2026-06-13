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
  renderResult: (out: JsonValue) => React.ReactNode;
  toMarkdown: (out: JsonValue) => string;
}) {
  const run = useServerFn(runTool);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("General");
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
