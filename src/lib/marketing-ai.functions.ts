import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  brief: z.string().min(3).max(2000),
  kind: z.enum(["email", "instagram", "campaign", "product"]).default("campaign"),
  tone: z.string().max(120).optional(),
});

export const generateMarketingCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é a voz editorial da Mon Parfum — maison olfativa premium brasileira.
Escreva em português do Brasil, com tom sofisticado, sensorial, com toques em francês (Chapitre, La Collection).
Estética Vogue/Kinfolk. Frases curtas, cadência editorial. Nunca genérico.
Retorne apenas o texto final, sem preâmbulo.`;

    const userPrompt = `Formato: ${data.kind}
${data.tone ? `Tom desejado: ${data.tone}\n` : ""}Briefing: ${data.brief}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI Gateway ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { text };
  });
