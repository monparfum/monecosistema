import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — Mon Parfum" }] }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/conta`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada. Verifique seu e-mail para confirmar.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="eyebrow mb-3">Criar conta</div>
        <h1 className="font-display text-4xl mb-10">Junte-se à Mon Parfum</h1>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="eyebrow block mb-2">Nome completo</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="eyebrow block mb-2">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="eyebrow block mb-2">Senha</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <button disabled={loading} className="w-full bg-foreground text-background py-3 text-sm tracking-wide disabled:opacity-50">
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-foreground border-b border-border">Entrar</Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
