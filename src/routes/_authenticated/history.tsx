import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { OutlineContent } from "@/lib/outline-types";
import { OutlineView, outlineToMarkdown } from "@/components/OutlineView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Copy, Star, Trash2, FileText } from "lucide-react";
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

function HistoryPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Row | null>(null);

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

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("outlines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (selected?.id === id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["history"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Deleted");
  };

  const onFavorite = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("favorites").insert({ user_id: u.user.id, outline_id: id });
    if (error?.code === "23505") return toast.info("Already in favorites");
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["favorites"] });
    toast.success("Added to favorites");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] max-w-7xl">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-4">History</h1>
        {q.isLoading ? (
          <div className="space-y-2">{[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : q.data?.length === 0 ? (
          <Card className="surface-card"><CardContent className="p-8 text-center text-sm text-muted-foreground">No outlines yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {q.data?.map((row) => (
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
