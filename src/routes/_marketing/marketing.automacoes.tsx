import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";

const FLOWS = [
  { label: "Carrinho abandonado", canais: "Email · WhatsApp" },
  { label: "Pós-compra", canais: "Email" },
  { label: "Remarketing", canais: "Email · SMS" },
  { label: "Boas-vindas", canais: "Email" },
  { label: "Aniversário", canais: "WhatsApp" },
];

export const Route = createFileRoute("/_marketing/marketing/automacoes")({
  head: () => ({ meta: [{ title: "Automações — Marketing" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Marketing" title="Automações" description="Fluxos preparados para Email, WhatsApp e SMS." />
      <div className="border-y border-border divide-y divide-border">
        {FLOWS.map((f) => (
          <div key={f.label} className="py-5 flex items-center justify-between">
            <div>
              <div className="font-display text-xl">{f.label}</div>
              <div className="eyebrow mt-1">{f.canais}</div>
            </div>
            <button className="editorial-link">Configurar</button>
          </div>
        ))}
      </div>
      <EmptyState
        eyebrow="Provedores"
        title="Conecte um provedor para ativar os fluxos."
        description="Estrutura pronta para Email transacional, WhatsApp Business e SMS. Nenhum envio é feito até que um provedor seja conectado."
      />
    </div>
  ),
});
