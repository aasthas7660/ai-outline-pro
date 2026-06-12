import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateOutline } from "@/lib/outlines.functions";
import { LANGUAGES, TONES, AUDIENCES, LENGTHS, type OutlineContent } from "@/lib/outline-types";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OutlineView, outlineToMarkdown } from "@/components/OutlineView";
import { Sparkles, Copy, Star, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "New outline — OutlineCraft AI" }] }),
  component: NewOutline,
});

function NewOutline() {
  const qc = useQueryClient();
  const gen = useServerFn(generateOutline);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("English");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("General");
  const [length, setLength] = useState("Medium");
  const [outline, setOutline] = useState<{ id: string; content: OutlineContent } | null>(null);

  const mut = useMutation({
    mutationFn: () => gen({ data: { topic, language, tone, audience, length } }),
    onSuccess: (data) => {
      setOutline(data);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      toast.success("Outline generated!");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Generation failed"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 3) return toast.error("Topic must be at least 3 characters");
    mut.mutate();
  };

  const onCopy = async () => {
    if (!outline) return;
    await navigator.clipboard.writeText(outlineToMarkdown(outline.content));
    toast.success("Copied as Markdown");
  };

  const onFavorite = async () => {
    if (!outline) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("favorites").insert({ user_id: u.user.id, outline_id: outline.id });
    if (error) {
      if (error.code === "23505") toast.info("Already in favorites");
      else toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Added to favorites");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr] max-w-7xl">
      <div className="space-y-4">
        <Card className="surface-card sticky top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />New outline</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Blog topic</Label>
                <Textarea id="topic" rows={3} placeholder="e.g. How to choose a CRM for a 10-person sales team" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Language" value={language} onChange={setLanguage} options={LANGUAGES} />
                <Field label="Tone" value={tone} onChange={setTone} options={TONES} />
                <Field label="Audience" value={audience} onChange={setAudience} options={AUDIENCES} />
                <Field label="Length" value={length} onChange={setLength} options={LENGTHS} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={mut.isPending}>
                  {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Generate
                </Button>
                {outline && (
                  <Button type="button" variant="outline" size="icon" onClick={() => mut.mutate()} disabled={mut.isPending} title="Regenerate">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        {mut.isPending && <LoadingSkeleton />}
        {!mut.isPending && outline && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onCopy}><Copy className="mr-2 h-4 w-4" />Copy</Button>
              <Button variant="outline" size="sm" onClick={onFavorite}><Star className="mr-2 h-4 w-4" />Favorite</Button>
              <Button variant="outline" size="sm" onClick={() => mut.mutate()}><RefreshCw className="mr-2 h-4 w-4" />Regenerate</Button>
            </div>
            <OutlineView content={outline.content} />
          </div>
        )}
        {!mut.isPending && !outline && (
          <Card className="surface-card h-full grid place-items-center min-h-[400px]">
            <div className="text-center p-8">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 font-display text-xl">Fill in your topic to begin</p>
              <p className="mt-1 text-sm text-muted-foreground">Your generated outline will appear here.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
