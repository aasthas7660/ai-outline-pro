import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import type { OutlineContent } from "@/lib/outline-types";
import { OutlineView, outlineToMarkdown } from "@/components/OutlineView";
import { LANGUAGES, TONES, LENGTHS } from "@/lib/outline-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { Copy, Star, Trash2, FileText, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — OutlineCraft AI" }] }),
  component: HistoryPage,
});

type Row = {
  id: string;
  topic: string;
  language: string;
  tone: string;
  audience: string;
  length: string;
  content: OutlineContent;
  created_at: string;
};

const ANY = "__any__";

function HistoryPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<string>(ANY);
  const [tone, setTone] = useState<string>(ANY);
  const [length, setLength] = useState<string>(ANY);

  const q = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outlines")
        .select("id, topic, language, tone, audience, length, content, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((r) => {
      if (s && !r.topic.toLowerCase().includes(s)) return false;
      if (language !== ANY && r.language !== language) return false;
      if (tone !== ANY && r.tone !== tone) return false;
      if (length !== ANY && r.length !== length) return false;
      return true;
    });
  }, [q.data, search, language, tone, length]);

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("outlines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (selected?.id === id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["history"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Deleted");
  };

  const onFavorite = async (id: string) => {
    const { data: s_ } = await supabase.auth.getSession();
    const u = { user: s_.session?.user ?? null };
    if (!u.user) return;
    const { error } = await supabase.from("favorites").insert({ user_id: u.user.id, outline_id: id });
    if (error?.code === "23505") return toast.info("Already in favorites");
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["favorites"] });
    toast.success("Added to favorites");
  };

  const resetFilters = () => { setSearch(""); setLanguage(ANY); setTone(ANY); setLength(ANY); };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr] max-w-7xl">
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold">History</h1>

        <Card className="surface-card">
          <CardContent className="p-3 space-y-2.5">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search topics…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <FilterSelect value={language} onChange={setLanguage} label="Language" options={LANGUAGES} />
              <FilterSelect value={tone} onChange={setTone} label="Tone" options={TONES} />
              <FilterSelect value={length} onChange={setLength} label="Length" options={LENGTHS} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
              <button onClick={resetFilters} className="hover:text-foreground underline-offset-2 hover:underline">Reset</button>
            </div>
          </CardContent>
        </Card>

        {q.isLoading ? (
          <div className="space-y-2">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="surface-card"><CardContent className="p-8 text-center text-sm text-muted-foreground">No outlines match your filters.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((row) => (
              <Card key={row.id} className={`surface-card cursor-pointer transition ${selected?.id === row.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelected(row)}>
                <CardContent className="p-4">
                  <p className="font-medium truncate">{row.topic}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">{row.language}</Badge>
                    <Badge variant="secondary" className="text-xs">{row.tone}</Badge>
                    <Badge variant="secondary" className="text-xs">{row.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(outlineToMarkdown(selected.content)); toast.success("Copied"); }}>
                <Copy className="mr-2 h-4 w-4" />Copy
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFavorite(selected.id)}><Star className="mr-2 h-4 w-4" />Favorite</Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(selected.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
            </div>
            <OutlineView content={selected.content} />
          </div>
        ) : (
          <Card className="surface-card h-full grid place-items-center min-h-[400px]">
            <div className="text-center p-8">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Select an outline to view it.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>All {label.toLowerCase()}s</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
