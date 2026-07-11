import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/module-shell";

const GROUPS = [
  {
    label: "Núcleo",
    items: [
      { name: "Lovable Cloud · Postgres", status: "connected" },
      { name: "Lovable Cloud · Auth", status: "connected" },
      { name: "Lovable Cloud · Storage", status: "connected" },
      { name: "Lovable AI Gateway", status: "connected" },
    ],
  },
  {
    label: "Pagamentos",
    items: [
      { name: "Stripe", status: "pending" },
      { name: "Mercado Pago", status: "pending" },
      { name: "PIX", status: "pending" },
    ],
  },
  {
    label: "Transportadoras",
    items: [
      { name: "Correios", status: "pending" },
      { name: "Melhor Envio", status: "pending" },
      { name: "Jadlog", status: "pending" },
    ],
  },
  {
    label: "Mensageria",
    items: [
      { name: "Email transacional", status: "pending" },
      { name: "WhatsApp Business", status: "pending" },
      { name: "SMS", status: "pending" },
    ],
  },
  {
    label: "Social",
    items: [
      { name: "Instagram", status: "pending" },
      { name: "TikTok", status: "pending" },
      { name: "YouTube", status: "pending" },
    ],
  },
];

export const Route = createFileRoute("/_administracao/administracao/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — Administração" }] }),
  component: () => (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Administração"
        title="Integrações"
        description="Serviços que alimentam os módulos. Núcleo já conectado; demais dependem de credenciais externas."
      />
      {GROUPS.map((g) => (
        <section key={g.label}>
          <div className="eyebrow mb-3">{g.label}</div>
          <div className="grid md:grid-cols-2 gap-px bg-border border border-border">
            {g.items.map((i) => (
              <div key={i.name} className="bg-background p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {i.status === "connected" ? (
                    <CheckCircle2 className="size-4 text-[color:var(--gold)]" strokeWidth={1.5} />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  )}
                  <div className="font-display text-lg">{i.name}</div>
                </div>
                <span className={`eyebrow ${i.status === "connected" ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>
                  {i.status === "connected" ? "Conectado" : "Aguardando"}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
});
