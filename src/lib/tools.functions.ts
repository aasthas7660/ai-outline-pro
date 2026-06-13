import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TOOL_TYPES = [
  "seo_analysis",
  "title_generator",
  "hook_generator",
  "cta_generator",
  "summary_generator",
  "faq_generator",
  "table_generator",
] as const;
export type ToolType = (typeof TOOL_TYPES)[number];

const RunSchema = z.object({
  tool_type: z.enum(TOOL_TYPES),
  topic: z.string().min(2).max(500),
  // optional context fields used by some tools
  audience: z.string().max(120).optional(),
  tone: z.string().max(60).optional(),
  language: z.string().max(40).optional().default("English"),
  extra: z.string().max(500).optional(),
});

type RunInput = z.infer<typeof RunSchema>;

function buildPrompt(d: RunInput): string {
  const ctx = `Topic: ${d.topic}
Language: ${d.language ?? "English"}${d.audience ? `\nAudience: ${d.audience}` : ""}${d.tone ? `\nTone: ${d.tone}` : ""}${d.extra ? `\nNotes: ${d.extra}` : ""}

Return ONLY valid JSON (no markdown, no commentary) matching the schema described.`;

  switch (d.tool_type) {
    case "seo_analysis":
      return `You are an expert SEO strategist. Produce a complete SEO brief.
${ctx}

Schema:
{
  "primary_keyword": string,
  "secondary_keywords": string[],        // 5-8
  "long_tail_keywords": string[],        // 5-8
  "semantic_keywords": string[],         // 6-10 LSI/related
  "search_intent": "informational" | "navigational" | "transactional" | "commercial",
  "seo_score": number,                   // 0-100 realistic estimate for this topic difficulty
  "recommended_word_count": number,      // realistic e.g. 1200
  "url_slug": string,                    // kebab-case, no stopwords
  "meta_title": string,                  // <= 60 chars
  "meta_description": string             // <= 160 chars
}`;
    case "title_generator":
      return `Generate 10 SEO-friendly, click-worthy blog titles.
${ctx}

Schema:
{ "titles": string[] }   // exactly 10`;
    case "hook_generator":
      return `Write powerful opening hooks for a blog post.
${ctx}

Schema:
{
  "question_hooks": string[],   // 3
  "story_hooks": string[],      // 3
  "curiosity_hooks": string[],  // 3
  "statistic_hooks": string[]   // 3
}`;
    case "cta_generator":
      return `Write compelling calls-to-action.
${ctx}

Schema:
{
  "soft_cta": string[],         // 3 gentle/low-friction
  "strong_cta": string[],       // 3 urgent/direct
  "newsletter_cta": string[]    // 3 email signup focused
}`;
    case "summary_generator":
      return `Summarize the topic into multiple formats.
${ctx}

Schema:
{
  "short_summary": string,           // 2-3 sentences
  "bullet_summary": string[],        // 5-7 bullets
  "key_takeaways": string[]          // 4-6 takeaways
}`;
    case "faq_generator":
      return `Generate FAQs relevant to the topic.
${ctx}

Schema:
{ "faqs": [ { "question": string, "answer": string } ] }   // 8 items`;
    case "table_generator":
      return `Generate a useful comparison/information table relevant to the topic.
${ctx}

Schema:
{
  "title": string,
  "type": "comparison" | "information",
  "columns": string[],                  // 3-5
  "rows": string[][]                    // 4-8 rows; each row length == columns length
}`;
  }
}

export const runTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    let result;
    try {
      result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt: buildPrompt(data),
        temperature: 0.7,
        providerOptions: { lovable: { response_format: { type: "json_object" } } },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Add credits to continue.");
      throw new Error(msg || "Generation failed");
    }

    const raw = result.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let output: Record<string, unknown>;
    try {
      output = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned an invalid response. Please retry.");
      output = JSON.parse(m[0]) as Record<string, unknown>;
    }

    const insert = await context.supabase
      .from("tool_results")
      .insert({
        user_id: context.userId,
        tool_type: data.tool_type,
        input: JSON.parse(JSON.stringify(data)),
        output: JSON.parse(JSON.stringify(output)),
      })
      .select("id")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    return { id: insert.data.id, output };
  });
