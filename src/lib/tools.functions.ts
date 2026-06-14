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
  "competitor_analysis",
  "schema_generator",
  "internal_links",
  "content_calendar",
  "image_suggestions",
  "content_gap",
  "content_brief",
] as const;
export type ToolType = (typeof TOOL_TYPES)[number];


const RunSchema = z.object({
  tool_type: z.enum(TOOL_TYPES),
  topic: z.string().min(2).max(500),
  audience: z.string().max(120).optional(),
  tone: z.string().max(60).optional(),
  language: z.string().max(40).optional().default("English"),
  extra: z.string().max(2000).optional(),
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
  "secondary_keywords": string[],
  "long_tail_keywords": string[],
  "semantic_keywords": string[],
  "search_intent": "informational" | "navigational" | "transactional" | "commercial",
  "seo_score": number,
  "recommended_word_count": number,
  "url_slug": string,
  "meta_title": string,
  "meta_description": string
}`;
    case "title_generator":
      return `Generate 10 SEO-friendly, click-worthy blog titles.
${ctx}

Schema: { "titles": string[] }`;
    case "hook_generator":
      return `Write powerful opening hooks for a blog post.
${ctx}

Schema:
{
  "question_hooks": string[],
  "story_hooks": string[],
  "curiosity_hooks": string[],
  "statistic_hooks": string[]
}`;
    case "cta_generator":
      return `Write compelling calls-to-action.
${ctx}

Schema:
{
  "soft_cta": string[],
  "strong_cta": string[],
  "newsletter_cta": string[]
}`;
    case "summary_generator":
      return `Summarize the topic into multiple formats.
${ctx}

Schema:
{
  "short_summary": string,
  "bullet_summary": string[],
  "key_takeaways": string[]
}`;
    case "faq_generator":
      return `Generate FAQs relevant to the topic.
${ctx}

Schema: { "faqs": [ { "question": string, "answer": string } ] }`;
    case "table_generator":
      return `Generate a useful comparison/information table relevant to the topic.
${ctx}

Schema:
{
  "title": string,
  "type": "comparison" | "information",
  "columns": string[],
  "rows": string[][]
}`;
    case "competitor_analysis":
      return `Act as a senior SEO content strategist. Analyze the competitive landscape for the topic and surface opportunities.
${ctx}

Schema:
{
  "competitor_headings": string[],          // 8-12 H2-style headings commonly used by top-ranking competitors
  "missing_sections": string[],             // 5-8 angles competitors miss that you should cover
  "snippet_opportunities": [                 // 4-6 featured-snippet plays
    { "type": "paragraph" | "list" | "table", "query": string, "suggested_answer": string }
  ],
  "people_also_ask": string[]               // 8-10 PAA-style questions
}`;
    case "schema_generator":
      return `Generate three Schema.org JSON-LD blocks for a blog article about the topic. Use realistic placeholder values where needed.
${ctx}

Schema:
{
  "faq_schema": object,        // valid JSON-LD with @context, @type "FAQPage", mainEntity Question/Answer
  "article_schema": object,    // valid JSON-LD with @context, @type "Article" (headline, description, author, datePublished, image)
  "breadcrumb_schema": object  // valid JSON-LD with @context, @type "BreadcrumbList", itemListElement
}`;
    case "internal_links":
      return `Suggest internal link anchor texts, related article ideas, and authoritative external references for the topic.
${ctx}

Schema:
{
  "anchor_texts": string[],                                              // 8-10 natural anchor text phrases
  "related_articles": [ { "title": string, "reason": string } ],        // 6-8 related post ideas
  "external_references": [ { "title": string, "url": string, "why": string } ]   // 5-7 authoritative sources (real, well-known sites)
}`;
    case "content_calendar":
      return `Create a structured content calendar for the topic / niche.
${ctx}

Schema:
{
  "weekly": [ { "day": string, "title": string, "type": string } ],                 // 5-7 items, mon-sun
  "monthly": [ { "week": string, "theme": string, "posts": [ { "title": string, "type": string } ] } ], // 4 weeks
  "publishing_schedule": [ { "day": string, "time": string, "channel": string } ]   // 4-6 recurring slots
}`;
    case "image_suggestions":
      return `You are a visual content director for a blog post. Suggest images for the article's sections plus a featured image and a social thumbnail. Always include descriptive SEO alt text.
${ctx}

Schema:
{
  "featured_image": { "title": string, "description": string, "type": "Illustration"|"Infographic"|"Screenshot"|"Diagram"|"Photo"|"Comparison chart", "alt_text": string },
  "social_thumbnail": { "title": string, "description": string, "type": "Illustration"|"Infographic"|"Screenshot"|"Diagram"|"Photo"|"Comparison chart", "alt_text": string },
  "sections": [
    {
      "section_name": string,                  // H2 section title
      "image_title": string,
      "image_description": string,
      "image_type": "Illustration"|"Infographic"|"Screenshot"|"Diagram"|"Photo"|"Comparison chart",
      "alt_text": string
    }
  ]                                            // 5-8 sections
}`;
    case "content_gap":
      return `Act as an SEO content auditor. Analyse the provided article and identify gaps vs. top-ranking content for the topic. Score the article fairly (0-100).
${ctx}

Schema:
{
  "content_score": number,                    // 0-100 overall
  "seo_coverage": number,                     // 0-100
  "topic_coverage": number,                   // 0-100
  "missing_headings": string[],               // 5-10
  "missing_subtopics": string[],              // 5-10
  "missing_faqs": [ { "question": string, "answer": string } ],   // 4-8
  "missing_keywords": {
    "primary": string[],
    "secondary": string[],
    "semantic": string[]
  },
  "recommendations": {
    "thin_sections": string[],
    "expand_opportunities": string[],
    "better_explanations": string[],
    "readability": string[]
  }
}`;
    case "content_brief":
      return `Create a complete pre-writing content brief, similar to Surfer SEO / Frase briefs.
${ctx}

Schema:
{
  "search_intent": "informational" | "commercial" | "transactional" | "navigational",
  "target_audience": string,
  "content_goal": string,
  "word_count": number,
  "primary_keyword": string,
  "structure": {
    "h1": string,
    "sections": [ { "h2": string, "h3": string[] } ]   // 5-8 H2s with 2-4 H3s each
  },
  "important_questions": string[],            // 6-10
  "important_topics": string[],               // 6-10
  "keywords": {
    "primary": string,
    "secondary": string[],
    "long_tail": string[],
    "semantic": string[]
  },
  "internal_links": [ { "title": string, "reason": string } ],
  "external_references": [ { "title": string, "url": string, "why": string } ],
  "key_takeaways": string[],
  "writing_guidelines": { "tone": string, "reading_level": string, "formatting": string }
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
    type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
    let output: JsonValue;
    try {
      output = JSON.parse(raw) as JsonValue;
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned an invalid response. Please retry.");
      output = JSON.parse(m[0]) as JsonValue;
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
