import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OutlineContent } from "@/lib/outline-types";
import { outlineToMarkdown } from "@/components/OutlineView";
import { outlineToHtml, outlineToBloggerHtml, outlineToTxt, downloadBlob, FORMAT_META, type ExportFormat } from "@/lib/export-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Copy, FileDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/export-center")({
  head: () => ({ meta: [{ title: "Export Center — OutlineCraft AI" }] }),
  component: ExportCenter,
});

type Row = { id: string; topic: string; content: OutlineContent; created_at: string };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "outline";
}

function renderFormat(c: OutlineContent, fmt: ExportFormat): string {
  switch (fmt) {
    case "markdown": return outlineToMarkdown(c);
    case "html": return outlineToHtml(c);
    case "txt": return outlineToTxt(c);
    case "blogger": return outlineToBloggerHtml(c);
  }
}

function ExportCenter() {
  const [search, setSearch] = useState("");
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [selected, setSelected] = useState<Row | null>(null);

  const q = useQuery({
    queryKey: ["export-outlines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outlines")
        .select("id, topic, content, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return q.data ?? [];
    return (q.data ?? []).filter((r) => r.topic.toLowerCase().includes(s));
  }, [q.data, search]);

  const preview = selected ? renderFormat(selected.content, format) : "";

  const onDownload = () => {
    if (!selected) return;
    const meta = FORMAT_META[format];
    const name = `${slugify(selected.topic)}.${meta.ext}`;
    downloadBlob(name, preview, meta.mime);
    toast.success(`Downloaded ${name}`);
  };
  const onCopy = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(preview);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="max-w-7xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold">Export Center</h1>
        <p className="text-muted-foreground mt-1">Export any outline as Markdown, HTML, TXT or Blogger-ready HTML.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="text-base">Your outlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search by topic…" value={search} onChange={(e) => setSearch(e.target.value)} />
            {q.isLoading ? (
              <div className="space-y-2">{[0,1,2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No outlines match your search.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {filtered.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left rounded-md border p-3 transition hover:border-primary/60 ${selected?.id === r.id ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <p className="font-medium text-sm truncate">{r.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="h-4 w-4 text-primary" /> Export
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(FORMAT_META) as ExportFormat[]).map((k) => (
                      <SelectItem key={k} value={k}>{FORMAT_META[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={onCopy} disabled={!selected}><Copy className="mr-1.5 h-4 w-4" />Copy</Button>
                <Button size="sm" onClick={onDownload} disabled={!selected}><Download className="mr-1.5 h-4 w-4" />Download</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selected.topic}</Badge>
                  <Badge variant="outline">{FORMAT_META[format].label}</Badge>
                </div>
                <pre className="overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs leading-relaxed font-mono max-h-[60vh] whitespace-pre-wrap">{preview}</pre>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">Select an outline to preview &amp; export.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
