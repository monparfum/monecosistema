import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Copy } from "lucide-react";
import { PageHeader } from "@/components/module-shell";
import { generateMarketingCopy } from "@/lib/marketing-ai.functions";
import { toast } from "sonner";

const KINDS = [
  { id: "campaign", label: "Campanha" },
  { id: "email", label: "Email" },
  { id: "instagram", label: "Instagram" },
  { id: "product", label: "Descrição de produto" },
] as const;

export const Route = createFileRoute("/_marketing/marketing/ia")({
  head: () => ({ meta: [{ title: "IA de Marketing — Mon Parfum" }] }),
  component: IaMarketing,
});

function IaMarketing() {
  const fn = useServerFn(generateMarketingCopy);
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("campaign");
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("");
  const [output, setOutput] = useState("");

  const gen = useMutation({
    mutationFn: async () => {
      const res = await fn({ data: { brief, kind, tone: tone || undefined } });
      return res.text;
    },
    onSuccess: (text) => setOutput(text),
    onError: (e: Error) => toast.error(e.message || "Falha ao gerar."),
  });

  return (
    <div className="space-y-10 max-w-[1100px]">
      <PageHeader
        eyebrow="Marketing · Inteligência"
        title="IA editorial"
        description="Gera peças no tom Mon Parfum. Conectada ao gateway Lovable AI."
        actions={<Sparkles className="size-6 text-[color:var(--gold)]" strokeWidth={1.2} />}
      />

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <div className="eyebrow mb-2">Formato</div>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKind(k.id)}
                  className={`px-4 py-2 text-sm border ${kind === k.id ? "bg-foreground text-background border-foreground" : "border-border"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-2">Briefing</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={8}
              placeholder="Ex: lançamento do perfume Nuit d'Ambre, público 30-45, foco em profundidade e madeiras."
              className="w-full border border-border bg-background p-4 text-sm font-body"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Tom (opcional)</label>
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Ex: íntimo, poético, cinemático"
              className="w-full border border-border bg-background p-3 text-sm"
            />
          </div>

          <button
            onClick={() => gen.mutate()}
            disabled={!brief.trim() || gen.isPending}
            className="bg-foreground text-background px-6 py-3 text-sm disabled:opacity-40"
          >
            {gen.isPending ? "Compondo…" : "Compor peça"}
          </button>
        </div>

        <div className="border border-border p-6 min-h-[400px] bg-[color:var(--cream)]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow">Resultado</div>
            {output && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success("Copiado.");
                }}
                className="editorial-link inline-flex items-center gap-1 text-xs"
              >
                <Copy className="size-3" /> Copiar
              </button>
            )}
          </div>
          {output ? (
            <div className="font-display text-lg leading-relaxed whitespace-pre-wrap">{output}</div>
          ) : (
            <p className="text-sm text-muted-foreground italic">A peça aparece aqui.</p>
          )}
        </div>
      </div>
    </div>
  );
}
