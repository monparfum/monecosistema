import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_ops/ops/expedicao")({
  head: () => ({ meta: [{ title: "Expedição — Operações" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader
        eyebrow="Operações"
        title="Expedição"
        description="Emissão de etiquetas, código de rastreio e integração com transportadoras."
      />
      <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
        {["Correios","Melhor Envio","Jadlog","Transportadora própria"].map((t) => (
          <div key={t} className="bg-background p-8">
            <div className="eyebrow">Integração</div>
            <div className="font-display text-2xl mt-2">{t}</div>
            <p className="text-sm text-muted-foreground mt-3">Conectar em breve — endpoint e credenciais.</p>
          </div>
        ))}
      </div>
      <EmptyState
        eyebrow="Etiquetas"
        title="Nenhuma etiqueta emitida."
        description="Após conectar uma transportadora, cada pedido pago poderá gerar etiqueta e código de rastreio a partir desta tela."
      />
    </div>
  ),
});
