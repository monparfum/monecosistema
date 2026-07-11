import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/module-shell";

const CAPACITIES = [
  { label: "Analisar redes sociais", hint: "Insights de performance e sentimento." },
  { label: "Sugerir conteúdos", hint: "Ideias baseadas em tendências e nicho." },
  { label: "Analisar concorrentes", hint: "Monitoramento de marcas selecionadas." },
  { label: "Criar campanhas", hint: "Estruturar peças, canais e cronograma." },
  { label: "Identificar tendências", hint: "Sinais fracos em olfativo e lifestyle." },
  { label: "Calendário editorial", hint: "Distribuição inteligente por rede." },
];

export const Route = createFileRoute("/_marketing/marketing/ia")({
  head: () => ({ meta: [{ title: "IA de Marketing — Mon Parfum" }] }),
  component: () => (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Marketing · Inteligência"
        title="IA de Marketing"
        description="Estrutura preparada para receber um agente de marketing. Ainda não conectado a nenhum provedor."
        actions={<Sparkles className="size-6 text-[color:var(--gold)]" strokeWidth={1.2} />}
      />
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {CAPACITIES.map((c) => (
          <div key={c.label} className="bg-background p-6">
            <div className="eyebrow">Capacidade</div>
            <div className="font-display text-xl mt-1">{c.label}</div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.hint}</p>
          </div>
        ))}
      </div>
      <div className="border border-border p-8">
        <div className="eyebrow mb-2">Console</div>
        <div className="font-display text-2xl">Ative a IA quando estiver pronto.</div>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
          O painel acima descreve o que a IA fará. Nenhum modelo é chamado nesta fase — a integração acontece em uma etapa dedicada, sem quebrar nada do que já existe.
        </p>
      </div>
    </div>
  ),
});
