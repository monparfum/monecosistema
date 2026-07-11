import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({ meta: [{ title: "Minha conta — Mon Parfum" }] }),
  component: Conta,
});

function Conta() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="eyebrow mb-3">Minha conta</div>
        <h1 className="font-display text-5xl mb-12">Olá</h1>
        <dl className="grid grid-cols-[140px_1fr] gap-y-4 text-sm border-y border-border py-6">
          <dt className="eyebrow">E-mail</dt><dd>{user?.email}</dd>
        </dl>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/pedidos" className="bg-foreground text-background px-5 py-2.5 text-sm">Meus pedidos</Link>
          <Link to="/meus-cursos" className="border border-border px-5 py-2.5 text-sm">Meus cursos</Link>
          <button onClick={signOut} className="border border-border px-5 py-2.5 text-sm">Sair</button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
