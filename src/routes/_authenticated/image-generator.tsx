import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  planImages,
  generateOneImage,
  listImages,
  toggleSaveImage,
  deleteImage,
  IMAGE_STYLES,
  ASPECT_RATIOS,
  type PlannedImage,
  type ImageStyle,
  type AspectRatio,
} from "@/lib/image-gen.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Star,
  Trash2,
  ImagePlus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/image-generator")({
  head: () => ({ meta: [{ title: "AI Image Generator — OutlineCraft AI" }] }),
  component: ImageGeneratorPage,
});

type GeneratedRow = {
  id: string;
  topic: string;
  section_name: string | null;
  kind: string;
  image_url: string;
  image_prompt: string;
  image_style: string;
  aspect_ratio: string;
  alt_text: string | null;
  filename: string | null;
  saved: boolean;
  created_at: string;
};

type PlanItem = PlannedImage & {
  status: "pending" | "loading" | "done" | "error";
  row?: GeneratedRow;
  error?: string;
};

function ratioBoxClass(r: string): string {
  switch (r) {
    case "1:1":
      return "aspect-square";
    case "9:16":
      return "aspect-[9/16]";
    case "4:3":
      return "aspect-[4/3]";
    case "16:9":
    default:
      return "aspect-[16/9]";
  }
}

function ImageGeneratorPage() {
  const plan = useServerFn(planImages);
  const genOne = useServerFn(generateOneImage);
  const list = useServerFn(listImages);
  const toggleSave = useServerFn(toggleSaveImage);
  const del = useServerFn(deleteImage);

  /* -------- form state -------- */
  const [topic, setTopic] = useState("");
  const [outline, setOutline] = useState("");
  const [style, setStyle] = useState<ImageStyle>("Realistic");
  const [ratio, setRatio] = useState<AspectRatio>("16:9");
  const [incFeatured, setIncFeatured] = useState(true);
  const [incSections, setIncSections] = useState(true);
  const [incSocial, setIncSocial] = useState(false);
  const [incPin, setIncPin] = useState(false);
  const [maxSections, setMaxSections] = useState(5);

  /* -------- generation state -------- */
  const [items, setItems] = useState<PlanItem[]>([]);
  const [busy, setBusy] = useState(false);

  /* -------- gallery state -------- */
  const [gallery, setGallery] = useState<GeneratedRow[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<"all" | "featured" | "section" | "social" | "pinterest">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadGallery = async (reset: boolean) => {
    setGalleryLoading(true);
    try {
      const offset = reset ? 0 : offsetRef.current;
      const res = await list({ data: { search, kind: filterKind, saved_only: savedOnly, limit: 12, offset } });
      setGallery((prev) => (reset ? res.items : [...prev, ...res.items]) as GeneratedRow[]);
      offsetRef.current = offset + res.items.length;
      setHasMore(res.hasMore);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load gallery");
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    void loadGallery(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKind, savedOnly]);

  // search debounce
  useEffect(() => {
    const t = setTimeout(() => void loadGallery(true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !galleryLoading) void loadGallery(false);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, galleryLoading]);

  /* -------- generate flow -------- */
  const onGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 3) return toast.error("Please enter a blog topic");
    if (!incFeatured && !incSections && !incSocial && !incPin) {
      return toast.error("Choose at least one image to generate");
    }
    setBusy(true);
    setItems([]);
    try {
      const planRes = await plan({
        data: {
          topic: topic.trim(),
          outline: outline.trim() || undefined,
          style,
          ratio,
          include_featured: incFeatured,
          include_sections: incSections,
          include_social: incSocial,
          include_pinterest: incPin,
          max_sections: maxSections,
        },
      });
      const initial: PlanItem[] = planRes.plan.map((p) => ({ ...p, status: "pending" }));
      setItems(initial);

      for (let i = 0; i < initial.length; i++) {
        setItems((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "loading" } : p)));
        try {
          const r = await genOne({
            data: {
              topic: topic.trim(),
              kind: initial[i].kind,
              section_name: initial[i].section_name,
              image_prompt: initial[i].image_prompt,
              image_style: style,
              ratio: initial[i].ratio,
              alt_text: initial[i].alt_text,
              filename: initial[i].filename,
            },
          });
          setItems((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "done", row: r.record as GeneratedRow } : p,
            ),
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed";
          setItems((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "error", error: msg } : p)));
          toast.error(`${initial[i].image_title}: ${msg}`);
        }
      }
      toast.success("Image generation complete");
      void loadGallery(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to plan images");
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async (idx: number) => {
    const item = items[idx];
    if (!item) return;
    setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, status: "loading", error: undefined } : p)));
    try {
      const r = await genOne({
        data: {
          topic: topic.trim() || item.section_name || "blog",
          kind: item.kind,
          section_name: item.section_name,
          image_prompt: item.image_prompt,
          image_style: style,
          ratio: item.ratio,
          alt_text: item.alt_text,
          filename: item.filename,
        },
      });
      setItems((prev) =>
        prev.map((p, i) => (i === idx ? { ...p, status: "done", row: r.record as GeneratedRow } : p)),
      );
      toast.success("Regenerated");
      void loadGallery(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, status: "error", error: msg } : p)));
      toast.error(msg);
    }
  };

  const copyPrompt = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Prompt copied");
  };

  const downloadImg = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = name || "image.png";
      a.click();
      URL.revokeObjectURL(objUrl);
    } catch {
      toast.error("Download failed");
    }
  };

  const onToggleSave = async (row: GeneratedRow) => {
    try {
      await toggleSave({ data: { id: row.id, saved: !row.saved } });
      setGallery((prev) => prev.map((g) => (g.id === row.id ? { ...g, saved: !row.saved } : g)));
      toast.success(row.saved ? "Removed from saved" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const onDelete = async (row: GeneratedRow) => {
    if (!confirm("Delete this image?")) return;
    try {
      await del({ data: { id: row.id } });
      setGallery((prev) => prev.filter((g) => g.id !== row.id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold">AI Image Generator</h1>
        <p className="text-muted-foreground mt-1">
          Generate featured images, section visuals, social thumbnails, and Pinterest pins for your blog.
        </p>
      </header>

      {/* ---------- Form ---------- */}
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" /> Generate images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label>Blog topic</Label>
              <Textarea
                rows={2}
                placeholder="e.g. 10 productivity hacks for remote developers"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label>Article outline (optional)</Label>
              <Textarea
                rows={4}
                placeholder="Paste H2 headings so each section gets a matching image…"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                maxLength={4000}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Image style</Label>
                <Select value={style} onValueChange={(v) => setStyle(v as ImageStyle)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IMAGE_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Aspect ratio (sections)</Label>
                <Select value={ratio} onValueChange={(v) => setRatio(v as AspectRatio)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}{r === "16:9" ? " (Featured)" : r === "1:1" ? " (Social)" : r === "9:16" ? " (Vertical)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max section images</Label>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={maxSections}
                  onChange={(e) => setMaxSections(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={incFeatured} onCheckedChange={(v) => setIncFeatured(Boolean(v))} />
                Featured image (16:9)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={incSections} onCheckedChange={(v) => setIncSections(Boolean(v))} />
                Per-section images
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={incSocial} onCheckedChange={(v) => setIncSocial(Boolean(v))} />
                Social thumbnail (1:1)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={incPin} onCheckedChange={(v) => setIncPin(Boolean(v))} />
                Pinterest pin (9:16)
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate
              </Button>
              {items.length > 0 && !busy && (
                <Button type="button" variant="outline" onClick={() => { const f = document.createElement("form"); void onGenerate({ preventDefault: () => {}, currentTarget: f, target: f } as unknown as React.FormEvent); }}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate all
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ---------- Generation results ---------- */}
      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Results</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, idx) => (
              <Card key={idx} className="surface-card overflow-hidden">
                <div className={`relative bg-muted ${ratioBoxClass(it.ratio)}`}>
                  {it.status === "done" && it.row ? (
                    <img
                      src={it.row.image_url}
                      alt={it.row.alt_text ?? it.image_title}
                      className="h-full w-full object-cover"
                    />
                  ) : it.status === "loading" ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : it.status === "error" ? (
                    <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-destructive">
                      {it.error}
                    </div>
                  ) : (
                    <Skeleton className="h-full w-full rounded-none" />
                  )}
                  <Badge variant="secondary" className="absolute left-2 top-2 capitalize">
                    {it.kind}
                  </Badge>
                </div>
                <CardContent className="space-y-2 p-4">
                  <p className="line-clamp-2 text-sm font-medium">{it.image_title}</p>
                  {it.section_name && (
                    <p className="text-xs text-muted-foreground">Section: {it.section_name}</p>
                  )}
                  {it.alt_text && (
                    <p className="text-xs text-muted-foreground"><span className="font-semibold">Alt:</span> {it.alt_text}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button size="sm" variant="outline" onClick={() => copyPrompt(it.image_prompt)}>
                      <Copy className="mr-1 h-3 w-3" /> Prompt
                    </Button>
                    {it.row && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => downloadImg(it.row!.image_url, it.row!.filename ?? "image.png")}>
                          <Download className="mr-1 h-3 w-3" /> PNG
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onToggleSave(it.row!)}>
                          <Star className={`mr-1 h-3 w-3 ${it.row.saved ? "fill-primary text-primary" : ""}`} /> Save
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => regenerate(idx)} disabled={it.status === "loading"}>
                      <RefreshCw className="mr-1 h-3 w-3" /> Regen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Gallery ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Your image library</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topic…"
                className="pl-8 w-56"
              />
            </div>
            <Select value={filterKind} onValueChange={(v) => setFilterKind(v as typeof filterKind)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All kinds</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="section">Section</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="pinterest">Pinterest</SelectItem>
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={savedOnly} onCheckedChange={(v) => setSavedOnly(Boolean(v))} />
              Saved only
            </label>
          </div>
        </div>

        {gallery.length === 0 && !galleryLoading && (
          <Card className="surface-card"><CardContent className="p-8 text-center text-sm text-muted-foreground">
            No images yet — generate your first set above.
          </CardContent></Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gallery.map((row) => (
            <Card key={row.id} className="surface-card overflow-hidden">
              <div className={`relative bg-muted ${ratioBoxClass(row.aspect_ratio)}`}>
                <img src={row.image_url} alt={row.alt_text ?? row.topic} className="h-full w-full object-cover" loading="lazy" />
                <Badge variant="secondary" className="absolute left-2 top-2 capitalize">{row.kind}</Badge>
                {row.saved && (
                  <Badge className="absolute right-2 top-2"><Star className="mr-1 h-3 w-3 fill-current" /> Saved</Badge>
                )}
              </div>
              <CardContent className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm font-medium">{row.topic}</p>
                {row.section_name && <p className="text-xs text-muted-foreground line-clamp-1">{row.section_name}</p>}
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{row.image_style} · {row.aspect_ratio}</p>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  <Button size="sm" variant="outline" onClick={() => copyPrompt(row.image_prompt)}><Copy className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => downloadImg(row.image_url, row.filename ?? "image.png")}><Download className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" onClick={() => onToggleSave(row)}>
                    <Star className={`h-3 w-3 ${row.saved ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(row)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {galleryLoading && Array.from({ length: 4 }).map((_, i) => (
            <Card key={`sk-${i}`} className="surface-card overflow-hidden">
              <Skeleton className="aspect-[16/9] w-full rounded-none" />
              <CardContent className="space-y-2 p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
        <div ref={sentinelRef} className="h-8" />
      </section>
    </div>
  );
}

