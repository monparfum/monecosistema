import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_administracao/administracao/empresa")({
  head: () => ({ meta: [{ title: "Empresa — Administração" }] }),
  component: Empresa,
});

type Company = {
  id: string;
  name: string;
  legal_name: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  logo_url: string | null;
  currency: string;
};

function Empresa() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: async () => (await supabase.from("company_settings").select("*").eq("singleton", true).maybeSingle()).data as Company | null,
  });

  const [form, setForm] = useState<Company | null>(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const save = useMutation({
    mutationFn: async (patch: Partial<Company>) => {
      const { error } = await supabase.from("company_settings").update(patch).eq("singleton", true);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Dados salvos"); qc.invalidateQueries({ queryKey: ["company-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) return <div className="text-muted-foreground">Carregando…</div>;

  const set = <K extends keyof Company>(k: K, v: Company[K]) => setForm({ ...form, [k]: v });

  return (
    <div className="space-y-10 max-w-[900px]">
      <PageHeader
        eyebrow="Administração"
        title="Empresa"
        description="Dados institucionais usados em checkout, notas fiscais e rodapé."
        actions={
          <button
            onClick={() => save.mutate(form)}
            disabled={save.isPending}
            className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.15em] disabled:opacity-40"
          >
            Salvar
          </button>
        }
      />

      <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="space-y-8">
        <fieldset className="grid md:grid-cols-2 gap-6 border-y border-border py-8">
          <Field label="Nome fantasia" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="Razão social" value={form.legal_name ?? ""} onChange={(v) => set("legal_name", v)} />
          <Field label="CNPJ" value={form.cnpj ?? ""} onChange={(v) => set("cnpj", v)} />
          <Field label="URL do logo" value={form.logo_url ?? ""} onChange={(v) => set("logo_url", v)} />
        </fieldset>

        <fieldset className="grid md:grid-cols-2 gap-6 border-b border-border pb-8">
          <div className="md:col-span-2 eyebrow">Contato</div>
          <Field label="E-mail" value={form.email ?? ""} onChange={(v) => set("email", v)} />
          <Field label="Telefone" value={form.phone ?? ""} onChange={(v) => set("phone", v)} />
        </fieldset>

        <fieldset className="grid md:grid-cols-2 gap-6 border-b border-border pb-8">
          <div className="md:col-span-2 eyebrow">Endereço</div>
          <Field label="Endereço" value={form.address_line1 ?? ""} onChange={(v) => set("address_line1", v)} />
          <Field label="Cidade" value={form.address_city ?? ""} onChange={(v) => set("address_city", v)} />
          <Field label="Estado" value={form.address_state ?? ""} onChange={(v) => set("address_state", v)} />
          <Field label="CEP" value={form.address_postal_code ?? ""} onChange={(v) => set("address_postal_code", v)} />
        </fieldset>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="eyebrow mb-2">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
    </label>
  );
}
