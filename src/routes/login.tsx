import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/login")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Entrar — Mon Parfum" }] }),
  component: Login,
});

function Login() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta");
    if (redirect) {
      window.location.assign(redirect);
      return;
    }
    navigate({ to: "/conta" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="eyebrow mb-3">Entrar</div>
        <h1 className="font-display text-4xl mb-10">Sua boutique pessoal</h1>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="eyebrow block mb-2">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="eyebrow block mb-2">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <button disabled={loading} className="w-full bg-foreground text-background py-3 text-sm tracking-wide disabled:opacity-50">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Sem conta? <Link to="/cadastro" className="text-foreground border-b border-border">Criar conta</Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
