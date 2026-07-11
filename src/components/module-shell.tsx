import { Link, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type ModuleNavItem = { to: string; label: string; exact?: boolean };

export function ModuleShell({
  moduleLabel,
  eyebrow = "Módulo",
  nav,
  footer,
}: {
  moduleLabel: string;
  eyebrow?: string;
  nav: ModuleNavItem[];
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background grid grid-cols-[240px_1fr]">
      <aside className="border-r border-border p-6 flex flex-col gap-6 sticky top-0 h-screen">
        <div>
          <Link to="/" className="font-display text-2xl block leading-none">Mon Parfum</Link>
          <div className="eyebrow mt-1">{eyebrow} · {moduleLabel}</div>
        </div>

        <Link to="/admin/modulos" className="eyebrow text-muted-foreground hover:text-foreground">
          ← Módulos
        </Link>

        <nav className="space-y-1 text-sm border-t border-border pt-6">
          {nav.map((item) => (
            <SideLink key={item.to} to={item.to} exact={item.exact}>
              {item.label}
            </SideLink>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border space-y-2">
          {footer}
          <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground block">
            Ver site →
          </Link>
        </div>
      </aside>
      <main className="p-10"><Outlet /></main>
    </div>
  );
}

function SideLink({ to, exact, children }: { to: string; exact?: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: "block py-2 px-3 bg-[color:var(--muted)] text-foreground border-l-2 border-foreground" }}
      inactiveProps={{ className: "block py-2 px-3 text-muted-foreground hover:text-foreground border-l-2 border-transparent" }}
    >
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-8 mb-10">
      <div>
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="font-display text-4xl leading-none">{title}</h1>
        {description && (
          <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
