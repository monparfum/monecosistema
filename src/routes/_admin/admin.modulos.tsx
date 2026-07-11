import { createFileRoute, Link } from "@tanstack/react-router";
import { MODULES } from "@/lib/core/module-registry";

export const Route = createFileRoute("/_admin/admin/modulos")({
  head: () => ({ meta: [{ title: "Módulos — Mon Parfum" }] }),
  component: ModulesHub,
});

function ModulesHub() {
  return (
    <div className="space-y-16 max-w-[1400px]">
      <div>
        <div className="eyebrow mb-3">Central do administrador</div>
        <h1 className="font-display text-[clamp(2.75rem,4.5vw,4.5rem)] leading-[0.95]">
          Módulos<em className="italic text-muted-foreground"> da maison.</em>
        </h1>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground leading-relaxed">
          Cada módulo é independente visualmente, mas compartilha os mesmos dados do
          ecossistema. Um pedido no Commerce alimenta Operações, CRM, Academy (se for
          curso) e Marketing — sem duplicação.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.id}
              to={m.to}
              className="group bg-background p-8 flex flex-col justify-between min-h-[240px] hover:bg-[color:var(--muted)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow">{m.eyebrow}</div>
                  {m.status && (
                    <div className="mt-2 inline-block text-[10px] tracking-[0.2em] uppercase border border-[color:var(--gold)] text-[color:var(--gold)] px-2 py-0.5">
                      {m.status}
                    </div>
                  )}
                </div>
                <Icon className="size-6 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.2} />
              </div>
              <div className="mt-8">
                <div className="font-display text-4xl leading-none">{m.label}</div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">{m.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] tracking-[0.14em] uppercase text-muted-foreground">
                  {m.items.slice(0, 4).map((i) => <span key={i}>{i}</span>)}
                </div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground group-hover:text-foreground transition-colors ml-3 shrink-0">
                  Abrir →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border pt-8 text-xs text-muted-foreground max-w-2xl leading-relaxed">
        <span className="eyebrow block mb-2">Core</span>
        Autenticação, permissões, banco e barramento de eventos ficam na camada Core —
        invisível ao usuário, responsável por manter os módulos conversando entre si.
        Novos módulos são adicionados no registro central e aparecem aqui automaticamente.
      </div>
    </div>
  );
}
