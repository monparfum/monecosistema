import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/module-shell";
import { INTEGRATIONS, type Integration } from "@/lib/integrations-catalog";
import { getIntegrationStatus, saveIntegrationKeys, testIntegration } from "@/lib/integrations.functions";

export const Route = createFileRoute("/_administracao/administracao/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — Administração" }] }),
  component: Integracoes,
});

type Status = Awaited<ReturnType<typeof getIntegrationStatus>>;

function Integracoes() {
  const { data: s, error } = useQuery({ queryKey: ["integration-status"], queryFn: () => getIntegrationStatus() });
  const groups = [...new Set(INTEGRATIONS.map((i) => i.group))];

  return (
    <div className="space-y-10 max-w-[1100px]">
      <PageHeader eyebrow="Administração" title="Integrações"
        description="Configure aqui as chaves de pagamento, frete e e-mail. Depois de salvas, as chaves secretas nunca voltam para a tela — só o final, para conferência." />
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <section>
        <div className="eyebrow mb-3">Núcleo (configurado no servidor)</div>
        <div className="grid md:grid-cols-2 gap-3">
          <Fixed name="Supabase (banco, login, arquivos)" ok={s?.supabase} />
          <Fixed name="Área de membros (cursos digitais)" ok={s?.members} />
        </div>
      </section>

      {groups.map((g) => (
        <section key={g}>
          <div className="eyebrow mb-3">{g}</div>
          <div className="space-y-3">
            {INTEGRATIONS.filter((i) => i.group === g).map((i) => <IntegrationCard key={i.id} integration={i} status={s} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function Dot({ ok }: { ok?: boolean }) {
  return ok ? <CheckCircle2 className="size-4 text-[color:var(--gold)] shrink-0" strokeWidth={1.5} /> : <Circle className="size-4 text-muted-foreground shrink-0" strokeWidth={1.5} />;
}

function Fixed({ name, ok }: { name: string; ok?: boolean }) {
  return (
    <div className="border border-border bg-background p-5 flex items-center justify-between">
      <div className="flex items-center gap-3"><Dot ok={ok} /><div className="font-display text-lg">{name}</div></div>
      <span className={`eyebrow ${ok ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>{ok ? "Conectado" : "Aguardando"}</span>
    </div>
  );
}

function IntegrationCard({ integration: i, status }: { integration: Integration; status?: Status }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const keys = status?.keys ?? {};
  const ok = i.required.every((k) => keys[k]?.set);
  const anySet = i.fields.some((f) => keys[f.key]?.set);
  const fromPanel = i.fields.some((f) => keys[f.key]?.source === "painel");

  const open = () => {
    // Campos comuns já vêm preenchidos; segredos começam vazios (vazio = manter o atual)
    setForm(Object.fromEntries(i.fields.map((f) => [f.key, f.secret ? "" : (keys[f.key]?.hint ?? (f.options ? f.options[0][0] : ""))])));
    setEditing(true);
    setTest(null);
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ["integration-status"] });

  const runTest = async () => {
    setTesting(true);
    try { setTest(await testIntegration({ data: { id: i.id } })); }
    catch (e) { setTest({ ok: false, message: (e as Error).message }); }
    finally { setTesting(false); }
  };

  const save = async () => {
    const values: Record<string, string | null> = {};
    for (const f of i.fields) {
      const v = (form[f.key] ?? "").trim();
      if (f.secret) { if (v) values[f.key] = v; }            // segredo vazio = mantém
      else if (v !== (keys[f.key]?.hint ?? "")) values[f.key] = v || null;
    }
    if (!Object.keys(values).length) { setEditing(false); return; }
    setBusy(true);
    try {
      await saveIntegrationKeys({ data: { values } });
      toast.success(`${i.name}: chaves salvas`);
      setEditing(false);
      await refresh();
      if (i.testable) runTest();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm(`Remover as chaves de ${i.name} salvas no painel?`)) return;
    setBusy(true);
    try {
      await saveIntegrationKeys({ data: { values: Object.fromEntries(i.fields.map((f) => [f.key, null])) } });
      toast.success(`${i.name}: chaves removidas do painel`);
      setTest(null);
      await refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="border border-border bg-background">
      <div className="p-5 flex items-start justify-between gap-6">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-3"><Dot ok={ok} /><div className="font-display text-xl">{i.name}</div></div>
          <p className="text-sm text-muted-foreground max-w-2xl">{i.description}</p>
          {anySet && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              {i.fields.filter((f) => keys[f.key]?.set).map((f) => (
                <span key={f.key}><span className="text-muted-foreground">{f.label}:</span> <span className="font-mono">{keys[f.key]?.hint}</span>{keys[f.key]?.source === "servidor" && <span className="text-muted-foreground"> (servidor)</span>}</span>
              ))}
            </div>
          )}
          {test && <p className={`text-sm ${test.ok ? "text-[color:var(--gold)]" : "text-destructive"}`}>{test.ok ? "✓ " : "✗ "}{test.message}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`eyebrow ${ok ? "text-[color:var(--gold)]" : "text-muted-foreground"}`}>{ok ? "Conectado" : "Aguardando"}</span>
          <div className="flex gap-2">
            {i.testable && ok && <button onClick={runTest} disabled={testing} className="border border-border px-3 py-1.5 text-xs disabled:opacity-40">{testing ? "Testando…" : "Testar conexão"}</button>}
            {!editing && <button onClick={open} className="border border-foreground px-3 py-1.5 text-xs">{anySet ? "Trocar" : "Configurar"}</button>}
            {fromPanel && !editing && <button onClick={remove} disabled={busy} className="text-xs text-destructive underline">Remover</button>}
          </div>
        </div>
      </div>

      {editing && (
        <div className="border-t border-border p-5 space-y-4 bg-[color:var(--muted)]/20">
          {i.docs && (
            <a href={i.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline">
              Onde pegar: {i.docsLabel} <ExternalLink className="size-3" />
            </a>
          )}
          {i.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              {f.options ? (
                <select className="w-full border border-border bg-background px-3 py-2 text-sm" value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input
                  type={f.secret ? "password" : "text"} autoComplete="off" spellCheck={false}
                  className="w-full border border-border bg-background px-3 py-2 text-sm font-mono"
                  placeholder={f.secret && keys[f.key]?.set ? `Configurado (${keys[f.key]?.hint}) — deixe vazio para manter` : f.placeholder}
                  value={form[f.key] ?? ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
              {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
            </div>
          ))}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="border border-border px-4 py-2 text-xs">Cancelar</button>
            <button onClick={save} disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Salvando…" : "Salvar"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
