import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import type { OutlineContent } from "@/lib/outline-types";
import { OutlineView, outlineToMarkdown } from "@/components/OutlineView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — OutlineCraft AI" }] }),
  component: FavoritesPage,
});

type FavRow = {
  id: string;
  created_at: string;
  outlines: { id: string; topic: string; content: OutlineContent; created_at: string } | null;
};

function FavoritesPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id, created_at, outlines (id, topic, content, created_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as FavRow[];
    },
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["favorites"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Removed");
  };

  const selected = q.data?.find((f) => f.id === selectedId)?.outlines ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr] max-w-7xl">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-4">Favorites</h1>
        {q.isLoading ? (
          <div className="space-y-2">{[0,1,2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : q.data?.length === 0 ? (
          <Card className="surface-card"><CardContent className="p-8 text-center text-sm text-muted-foreground">No favorites yet. Star an outline to save it here.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {q.data?.map((f) => f.outlines && (
              <Card key={f.id} className={`surface-card cursor-pointer transition ${selectedId === f.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedId(f.id)}>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" /> {f.outlines.topic}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); remove(f.id); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        {selected ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(outlineToMarkdown(selected.content)); toast.success("Copied"); }}>
                <Copy className="mr-2 h-4 w-4" />Copy as Markdown
              </Button>
            </div>
            <OutlineView content={selected.content} />
          </div>
        ) : (
          <Card className="surface-card h-full grid place-items-center min-h-[400px]">
            <div className="text-center p-8 text-muted-foreground">Select a favorite to preview.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
