import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const IMAGE_STYLES = [
  "Realistic",
  "Illustration",
  "Flat Design",
  "Infographic",
  "Minimal",
  "Cartoon",
  "Watercolor",
  "3D Render",
] as const;

export const ASPECT_RATIOS = ["16:9", "1:1", "4:3", "9:16"] as const;

export type ImageStyle = (typeof IMAGE_STYLES)[number];
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export type ImageKind = "featured" | "section" | "social" | "pinterest";

function ratioToSize(r: string): string {
  switch (r) {
    case "1:1":
      return "1024x1024";
    case "9:16":
      return "1024x1536";
    case "16:9":
    case "4:3":
    default:
      return "1536x1024";
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image";
}

/* ============================================================
 * PLAN — Use Gemini to plan all image prompts for a topic.
 * ============================================================ */

const PlanSchema = z.object({
  topic: z.string().min(2).max(300),
  outline: z.string().max(4000).optional(),
  style: z.enum(IMAGE_STYLES),
  ratio: z.enum(ASPECT_RATIOS),
  include_featured: z.boolean().default(true),
  include_social: z.boolean().default(false),
  include_pinterest: z.boolean().default(false),
  include_sections: z.boolean().default(true),
  max_sections: z.number().int().min(0).max(8).default(5),
});

export type PlannedImage = {
  kind: ImageKind;
  section_name: string | null;
  image_title: string;
  image_prompt: string;
  alt_text: string;
  filename: string;
  ratio: AspectRatio;
};

export const planImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanSchema.parse(d))
  .handler(async ({ data }): Promise<{ plan: PlannedImage[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `You are an art director planning images for a blog article.
Topic: ${data.topic}
Style: ${data.style}
Aspect ratio: ${data.ratio}
${data.outline ? `Article outline / H2 sections:\n${data.outline}` : "No outline provided — invent up to 5 logical H2 sections."}

Produce a JSON object describing each image to generate. Each "image_prompt" must be a vivid, descriptive prompt suitable for an AI image model (no text/words in image unless infographic), and must encode the requested style "${data.style}". Each "alt_text" must be SEO-friendly, descriptive, under 120 chars. Each "filename" must be a kebab-case slug without extension, under 60 chars.

Return ONLY JSON matching:
{
  "sections": [ { "section_name": string, "image_title": string, "image_prompt": string, "alt_text": string, "filename": string } ]   // ${data.include_sections ? `up to ${data.max_sections}` : "0"} items
}`;

    const result = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
      temperature: 0.7,
      providerOptions: { lovable: { response_format: { type: "json_object" } } },
    });
    const raw = result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: { sections?: Array<{ section_name?: string; image_title?: string; image_prompt?: string; alt_text?: string; filename?: string }> } = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const plan: PlannedImage[] = [];
    const baseSlug = slugify(data.topic);

    if (data.include_featured) {
      plan.push({
        kind: "featured",
        section_name: null,
        image_title: `Featured image: ${data.topic}`,
        image_prompt: `Featured hero image for a blog post about "${data.topic}". Style: ${data.style}. Eye-catching, professional, editorial composition, clean background, no text.`,
        alt_text: `Featured image for ${data.topic}`,
        filename: `${baseSlug}-featured`,
        ratio: "16:9",
      });
    }

    if (data.include_sections && Array.isArray(parsed.sections)) {
      for (const s of parsed.sections.slice(0, data.max_sections)) {
        const name = String(s.section_name ?? "Section").slice(0, 120);
        plan.push({
          kind: "section",
          section_name: name,
          image_title: String(s.image_title ?? name).slice(0, 160),
          image_prompt: String(s.image_prompt ?? `${name} illustration in ${data.style} style`).slice(0, 1500),
          alt_text: String(s.alt_text ?? `${name} — ${data.topic}`).slice(0, 200),
          filename: `${baseSlug}-${slugify(s.filename ?? name)}`,
          ratio: data.ratio,
        });
      }
    }

    if (data.include_social) {
      plan.push({
        kind: "social",
        section_name: null,
        image_title: `Social thumbnail: ${data.topic}`,
        image_prompt: `Square social media thumbnail for "${data.topic}". Style: ${data.style}. Bold focal subject centered, vibrant, attention-grabbing, no text.`,
        alt_text: `Social thumbnail for ${data.topic}`,
        filename: `${baseSlug}-social`,
        ratio: "1:1",
      });
    }
    if (data.include_pinterest) {
      plan.push({
        kind: "pinterest",
        section_name: null,
        image_title: `Pinterest pin: ${data.topic}`,
        image_prompt: `Vertical Pinterest-style pin for "${data.topic}". Style: ${data.style}. Tall composition, layered, vivid colors, magazine-cover quality, no text.`,
        alt_text: `Pinterest pin for ${data.topic}`,
        filename: `${baseSlug}-pinterest`,
        ratio: "9:16",
      });
    }

    return { plan };
  });

/* ============================================================
 * GENERATE ONE IMAGE — call Lovable AI Gateway image endpoint
 * ============================================================ */

const GenerateOneSchema = z.object({
  topic: z.string().min(2).max(300),
  kind: z.enum(["featured", "section", "social", "pinterest"]),
  section_name: z.string().max(200).nullable().optional(),
  image_prompt: z.string().min(4).max(2000),
  image_style: z.enum(IMAGE_STYLES),
  ratio: z.enum(ASPECT_RATIOS),
  alt_text: z.string().max(300).optional(),
  filename: z.string().max(120).optional(),
});

export const generateOneImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateOneSchema.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const size = ratioToSize(data.ratio);
    const fullPrompt = `${data.image_prompt}\n\nArt direction: ${data.image_style} style. High quality, suitable for blog publication, no embedded text or watermarks.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt: fullPrompt,
        size,
        quality: "low",
        n: 1,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
      throw new Error(`Image generation failed (${res.status}): ${errText.slice(0, 200)}`);
    }
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned by the AI service.");

    // decode base64 to bytes
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const slug = slugify(data.filename ?? `${data.kind}-${Date.now()}`);
    const path = `${context.userId}/${Date.now()}-${slug}.png`;

    const up = await context.supabase.storage
      .from("generated-images")
      .upload(path, bytes, { contentType: "image/png", upsert: false });
    if (up.error) throw new Error(`Storage upload failed: ${up.error.message}`);

    const signed = await context.supabase.storage
      .from("generated-images")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    const image_url = signed.data?.signedUrl ?? "";

    const insert = await context.supabase
      .from("generated_images")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        section_name: data.section_name ?? null,
        kind: data.kind,
        image_url,
        storage_path: path,
        image_prompt: data.image_prompt,
        image_style: data.image_style,
        aspect_ratio: data.ratio,
        alt_text: data.alt_text ?? null,
        filename: `${slug}.png`,
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    return { record: insert.data, image_url };
  });

/* ============================================================
 * LIST / TOGGLE SAVE / DELETE
 * ============================================================ */

const ListSchema = z.object({
  search: z.string().max(200).optional(),
  kind: z.enum(["featured", "section", "social", "pinterest", "all"]).default("all"),
  saved_only: z.boolean().default(false),
  limit: z.number().int().min(1).max(48).default(12),
  offset: z.number().int().min(0).default(0),
});

export const listImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListSchema.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("generated_images")
      .select("*")
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.kind !== "all") q = q.eq("kind", data.kind);
    if (data.saved_only) q = q.eq("saved", true);
    if (data.search && data.search.trim()) q = q.ilike("topic", `%${data.search.trim()}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // refresh signed URLs (signed URLs expire — regenerate cheaply)
    const items = await Promise.all(
      (rows ?? []).map(async (r) => {
        if (r.storage_path) {
          const s = await context.supabase.storage
            .from("generated-images")
            .createSignedUrl(r.storage_path, 60 * 60 * 24 * 7);
          return { ...r, image_url: s.data?.signedUrl ?? r.image_url };
        }
        return r;
      }),
    );
    return { items, hasMore: items.length === data.limit };
  });

export const toggleSaveImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), saved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generated_images")
      .update({ saved: data.saved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("generated_images")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      await context.supabase.storage.from("generated-images").remove([row.storage_path]);
    }
    const { error } = await context.supabase.from("generated_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
