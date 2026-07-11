import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/module-shell";

const GROUPS = [
  { label: "Pagamentos", items: ["Stripe", "Mercado Pago", "PIX"] },
  { label: "Transportadoras", items: ["Correios", "Melhor Envio", "Jadlog"] },
  { label: "Mensageria", items: ["Email", "WhatsApp", "SMS"] },
  { label: "Social", items: ["Instagram", "TikTok", "YouTube"] },
  { label: "IA", items: ["Gateway de modelo", "Provedor de imagens"] },
];

export const Route = createFileRoute("/_administracao/administracao/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — Administração" }] }),
  component: () => (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader eyebrow="Administração" title="Integrações" description="Endpoints externos que alimentam os módulos." />
      {GROUPS.map((g) => (
        <section key={g.label}>
          <div className="eyebrow mb-3">{g.label}</div>
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
            {g.items.map((i) => (
              <div key={i} className="bg-background p-5 flex items-center justify-between">
                <div className="font-display text-lg">{i}</div>
                <button className="editorial-link">Conectar</button>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
});
