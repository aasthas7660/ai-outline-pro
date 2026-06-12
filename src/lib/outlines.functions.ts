import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { OutlineContent } from "./outline-types";

const GenerateSchema = z.object({
  topic: z.string().min(3).max(300),
  language: z.string().min(2).max(40),
  tone: z.string().min(2).max(40),
  audience: z.string().min(2).max(60),
  length: z.string().min(2).max(40),
});

function buildPrompt(input: z.infer<typeof GenerateSchema>) {
  return `You are an expert blog editor. Create a detailed, well-structured blog OUTLINE.

Topic: ${input.topic}
Language: ${input.language} (write ALL output in this language)
Tone: ${input.tone}
Target audience: ${input.audience}
Content length: ${input.length}

Return ONLY valid JSON (no markdown, no commentary) matching this exact TypeScript type:

{
  "h1": string,                                    // compelling main title
  "introduction": string,                          // 2-4 sentence intro hook
  "sections": [                                    // 4-7 H2 sections
    { "h2": string, "h3": string[] }              // 2-5 H3 subheadings each
  ],
  "conclusion": string,                            // 2-4 sentence wrap-up
  "key_takeaways": string[],                       // 4-6 concise takeaways
  "related_topics": string[],                      // 5 related post ideas
  "faqs": [                                        // exactly 5 FAQs
    { "question": string, "answer": string }
  ]
}`;
}

export const generateOutline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured. Please contact support.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    let result;
    try {
      result = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        prompt: buildPrompt(data),
        temperature: 0.7,
        providerOptions: {
          lovable: { response_format: { type: "json_object" } },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429")) throw new Error("Rate limit reached. Please try again in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Please add credits in your workspace.");
      throw new Error(msg || "Generation failed");
    }

    // Extract JSON from the response (tolerate code fences)
    const raw = result.text.trim();
    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let content: OutlineContent;
    try {
      content = JSON.parse(jsonStr) as OutlineContent;
    } catch {
      // Try to find the first { ... } block
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI returned an invalid response. Please retry.");
      content = JSON.parse(match[0]) as OutlineContent;
    }

    // Persist
    const insert = await context.supabase
      .from("outlines")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        language: data.language,
        tone: data.tone,
        audience: data.audience,
        length: data.length,
        content: JSON.parse(JSON.stringify(content)),
      })
      .select("id")
      .single();

    if (insert.error) throw new Error(insert.error.message);

    return { id: insert.data.id, content };
  });
