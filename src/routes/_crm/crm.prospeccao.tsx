import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/module-shell";
import { Field, Modal, inputCls as input } from "@/components/crm-ui";
import { lookupCnpjs, scanWebsite, searchCompanies } from "@/lib/prospects.functions";
import { parseBRL, waHref } from "@/lib/crm";

export const Route = createFileRoute("/_crm/crm/prospeccao")({
  head: () => ({ meta: [{ title: "Prospecção — CRM" }] }),
  component: Prospeccao,
});

type Prospect = Tables<"prospects">;
type Extra = {
  maps_url?: string; situacao?: string; abertura?: string; capital_social?: number;
  socios?: { nome: string; cargo: string }[];
  site?: { emails: string[]; phones: string[]; social: string[]; verificado_em: string };
};

const SUGGESTIONS = [
  "Escritórios de advocacia", "Empresas de tecnologia", "Agências de eventos", "Bancos e cooperativas", "Construtoras e incorporadoras",
  "Clínicas e hospitais", "Hotéis", "Coworkings", "Concessionárias de veículos", "Escritórios de contabilidade", "Indústrias", "Imobiliárias",
];
const STATUS = [
  { id: "novo", label: "Novos" }, { id: "interessante", label: "Interessantes" },
  { id: "convertido", label: "Convertidos" }, { id: "descartado", label: "Descartados" }, { id: "", label: "Todos" },
];
const domainOf = (u: string | null) => { try { return u ? new URL(/^https?:/i.test(u) ? u : `https://${u}`).hostname.replace(/^www\./, "") : null; } catch { return null; } };
const norm = (s: string | null | undefined) => (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

function Prospeccao() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"google" | "cnpj">("google");
  const [status, setStatus] = useState("novo");
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [converting, setConverting] = useState<Prospect | null>(null);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false }).limit(2000);
      if (error) throw error;
      return data;
    },
  });

  // Quem já está no CRM (empresa ou oportunidade com mesmo nome, CNPJ ou domínio)
  const { data: crm } = useQuery({
    queryKey: ["prospects-crm-index"],
    queryFn: async () => {
      const [acc, leads] = await Promise.all([
        supabase.from("corporate_accounts").select("id, name, cnpj, domain, website"),
        supabase.from("leads").select("id, company, email").in("kind", ["corporativo", "manual"]),
      ]);
      const names = new Map<string, { to: "empresa" | "oportunidade"; id: string }>();
      const keys = new Map<string, { to: "empresa" | "oportunidade"; id: string }>();
      (leads.data ?? []).forEach((l) => {
        if (l.company) names.set(norm(l.company), { to: "oportunidade", id: l.id });
        const d = l.email.split("@")[1];
        if (d) keys.set(d.toLowerCase(), { to: "oportunidade", id: l.id });
      });
      (acc.data ?? []).forEach((a) => {
        const v = { to: "empresa" as const, id: a.id };
        names.set(norm(a.name), v);
        if (a.cnpj) keys.set(a.cnpj.replace(/\D/g, ""), v);
        if (a.domain) keys.set(a.domain, v);
        const d = domainOf(a.website); if (d) keys.set(d, v);
      });
      return { names, keys };
    },
  });
  const inCrm = (p: Prospect) => crm && (crm.names.get(norm(p.name)) ?? crm.names.get(norm(p.legal_name)) ??
    (p.cnpj ? crm.keys.get(p.cnpj) : undefined) ?? crm.keys.get(domainOf(p.website) ?? "-"));

  const counts = useMemo(() => Object.fromEntries(STATUS.map((s) => [s.id, s.id ? rows.filter((r) => r.status === s.id).length : rows.length])), [rows]);
  const list = useMemo(() => {
    const term = norm(q);
    return rows
      .filter((r) => (!status || r.status === status || recent.has(r.external_id ?? "")) &&
        (!term || [r.name, r.legal_name, r.category, r.city, r.search, r.cnpj].some((v) => norm(v).includes(term))))
      .sort((a, b) => Number(recent.has(b.external_id ?? "")) - Number(recent.has(a.external_id ?? "")));
  }, [rows, status, q, recent]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["prospects"] });

  const setStatusOf = async (ids: string[], s: string) => {
    if (!ids.length) return;
    const { error } = await supabase.from("prospects").update({ status: s }).in("id", ids);
    if (error) return toast.error(error.message);
    setSelected(new Set());
    refresh();
  };

  const afterExtract = (ids: string[], msg: string) => {
    setRecent(new Set(ids));
    setStatus("");
    setQ("");
    refresh();
    toast.success(msg);
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader eyebrow="CRM corporativo" title="Prospecção"
        description="Extraia empresas pelo Google Maps ou pelo CNPJ, encontre contatos no site delas e transforme as interessantes em oportunidades no funil." />

      <section className="border border-border">
        <div className="flex border-b border-border">
          {([["google", "Buscar empresas (Google Maps)"], ["cnpj", "Consultar CNPJ (Receita)"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-5 py-3 text-xs uppercase tracking-[0.15em] border-r border-border ${tab === id ? "bg-foreground text-background" : ""}`}>{label}</button>
          ))}
        </div>
        <div className="p-5">
          {tab === "google" ? <GoogleSearch onDone={afterExtract} /> : <CnpjLookup onDone={afterExtract} />}
        </div>
      </section>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex border border-border">
          {STATUS.map((s) => (
            <button key={s.id} onClick={() => { setStatus(s.id); setRecent(new Set()); setSelected(new Set()); }}
              className={`px-3 py-2 text-xs ${status === s.id && !recent.size ? "bg-foreground text-background" : ""}`}>
              {s.label} <span className="opacity-60">{counts[s.id]}</span>
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por nome, atividade, cidade, busca…" className={`${input} w-72`} />
        {recent.size > 0 && <span className="text-xs text-[color:var(--gold)]">Mostrando primeiro o resultado da última extração ({recent.size})</span>}
        {selected.size > 0 && (
          <div className="ml-auto flex gap-2 items-center text-xs">
            <span>{selected.size} selecionada(s)</span>
            <button onClick={() => setStatusOf([...selected], "interessante")} className="border border-border px-3 py-1.5">★ Interessante</button>
            <button onClick={() => setStatusOf([...selected], "descartado")} className="border border-border px-3 py-1.5">Descartar</button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !list.length ? (
        <p className="text-sm text-muted-foreground border border-border p-6">
          {rows.length ? "Nada nesta lista." : "Nenhuma empresa extraída ainda. Comece com uma busca acima."}
        </p>
      ) : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3 w-8"><input type="checkbox" checked={list.length > 0 && list.every((r) => selected.has(r.id))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(list.map((r) => r.id)) : new Set())} /></th>
                {["Empresa", "Local", "Contato", "Google", ""].map((h, i) => <th key={i} className="p-3 font-normal">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((p) => {
                const crmHit = inCrm(p);
                const extra = (p.extra ?? {}) as Extra;
                const isOpen = open === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className={`align-top ${p.status === "descartado" ? "opacity-50" : ""} ${recent.has(p.external_id ?? "") ? "bg-[color:var(--muted)]/40" : ""}`}>
                      <td className="p-3"><input type="checkbox" checked={selected.has(p.id)} onChange={(e) => {
                        const n = new Set(selected); if (e.target.checked) n.add(p.id); else n.delete(p.id); setSelected(n);
                      }} /></td>
                      <td className="p-3 max-w-[320px]">
                        <button onClick={() => setOpen(isOpen ? null : p.id)} className="font-medium text-left hover:underline">{p.status === "interessante" && "★ "}{p.name}</button>
                        <div className="text-xs text-muted-foreground">{p.category ?? "—"}{p.size ? ` · ${p.size}` : ""}</div>
                        <div className="flex flex-wrap gap-1 mt-1 text-[11px]">
                          <span className="border border-border px-1.5">{p.source === "google" ? "Google Maps" : p.source === "cnpj" ? "CNPJ" : "Manual"}</span>
                          {extra.situacao && extra.situacao !== "ATIVA" && <span className="border border-destructive text-destructive px-1.5">{extra.situacao}</span>}
                          {crmHit && <Link to={crmHit.to === "empresa" ? "/crm/empresas/$id" : "/crm/leads/$id"} params={{ id: crmHit.id }} className="bg-[color:var(--gold)] text-background px-1.5">já no CRM</Link>}
                          {p.status === "convertido" && p.lead_id && <Link to="/crm/leads/$id" params={{ id: p.lead_id }} className="bg-foreground text-background px-1.5">oportunidade →</Link>}
                        </div>
                      </td>
                      <td className="p-3 text-xs">{[p.city, p.state].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="p-3 text-xs space-y-0.5">
                        {p.phone && <div>{waHref(p.phone) ? <a href={waHref(p.phone)!} target="_blank" rel="noreferrer" className="underline">{p.phone}</a> : p.phone}</div>}
                        {p.email && <div><a href={`mailto:${p.email}`} className="underline">{p.email}</a></div>}
                        {p.website && <div><a href={/^https?:/i.test(p.website) ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="underline text-muted-foreground">{domainOf(p.website)}</a></div>}
                        {!p.phone && !p.email && !p.website && "—"}
                      </td>
                      <td className="p-3 text-xs whitespace-nowrap">{p.rating ? `${p.rating.toFixed(1)} ★ (${p.reviews ?? 0})` : "—"}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5 justify-end text-xs">
                          {p.status !== "convertido" && (
                            <>
                              <button onClick={() => setConverting(p)} className="bg-foreground text-background px-3 py-1.5">Transformar em oportunidade</button>
                              <button onClick={() => setStatusOf([p.id], p.status === "interessante" ? "novo" : "interessante")} className="border border-border px-2 py-1.5" title="Marcar como interessante">{p.status === "interessante" ? "★" : "☆"}</button>
                              <button onClick={() => setStatusOf([p.id], p.status === "descartado" ? "novo" : "descartado")} className="border border-border px-2 py-1.5">{p.status === "descartado" ? "Restaurar" : "Descartar"}</button>
                            </>
                          )}
                          <button onClick={() => setOpen(isOpen ? null : p.id)} className="underline px-1">{isOpen ? "fechar" : "detalhes"}</button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && <tr><td /><td colSpan={5} className="p-3 pt-0"><Details p={p} extra={extra} onChange={refresh} /></td></tr>}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Dados públicos de empresas (Google Maps, Receita Federal e o próprio site). Na abordagem, apresente-se e respeite quem pedir para não ser contatado (LGPD).
      </p>

      {converting && <Convert p={converting} onClose={() => setConverting(null)} onDone={() => {
        setConverting(null);
        refresh();
        ["prospects-crm-index", "crm-leads", "crm-empresas", "crm-accounts", "crm-stats"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      }} />}
    </div>
  );
}

function GoogleSearch({ onDone }: { onDone: (ids: string[], msg: string) => void }) {
  const [segment, setSegment] = useState("");
  const [city, setCity] = useState("Florianópolis");
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState<{ token: string; segment: string; city: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const run = async (pageToken?: string) => {
    const seg = pageToken ? next!.segment : segment, c = pageToken ? next!.city : city;
    setBusy(true); setErr(null);
    try {
      const r = await searchCompanies({ data: { segment: seg, city: c, pageToken } });
      setNext(r.nextPageToken ? { token: r.nextPageToken, segment: seg, city: c } : null);
      onDone(r.ids, r.found ? `${r.found} empresa(s) encontradas para “${seg}” em ${c}` : "Nenhuma empresa encontrada");
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-wrap gap-2">
        <input value={segment} onChange={(e) => setSegment(e.target.value)} required maxLength={100} placeholder="Segmento (ex.: escritórios de advocacia)" className={`${input} flex-1 min-w-[260px]`} />
        <input value={city} onChange={(e) => setCity(e.target.value)} required maxLength={80} placeholder="Cidade" className={`${input} w-56`} />
        <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.15em] disabled:opacity-40">{busy ? "Buscando…" : "Extrair"}</button>
        {next && <button type="button" disabled={busy} onClick={() => run(next.token)} className="border border-border px-4 py-2 text-xs disabled:opacity-40">Mais 20 resultados</button>}
      </form>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => <button key={s} onClick={() => setSegment(s)} className={`text-xs border px-2 py-1 ${segment === s ? "border-foreground" : "border-border text-muted-foreground"}`}>{s}</button>)}
      </div>
      {err && (
        <p className="text-sm text-destructive">{err}{/Integrações/.test(err) && <> — <Link to="/administracao/integracoes" className="underline">abrir Integrações</Link></>}</p>
      )}
      <p className="text-xs text-muted-foreground">Até 20 empresas por busca (60 com “mais resultados”). Empresas já extraídas não duplicam e as descartadas continuam descartadas.</p>
    </div>
  );
}

function CnpjLookup({ onDone }: { onDone: (ids: string[], msg: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const cnpjs = [...new Set(text.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g) ?? [])];
  const run = async () => {
    setBusy(true); setErrors([]);
    try {
      const r = await lookupCnpjs({ data: { cnpjs } });
      setErrors(r.errors);
      if (r.ids.length) { onDone(r.ids, `${r.ids.length} CNPJ(s) consultado(s)`); setText(""); }
    } catch (e) { setErrors([(e as Error).message]); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-3">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={"Cole um ou vários CNPJs (até 20), em qualquer formato:\n12.345.678/0001-90\n98765432000110"} className={`${input} w-full font-mono`} />
      <div className="flex items-center gap-3">
        <button onClick={run} disabled={busy || !cnpjs.length || cnpjs.length > 20} className="bg-foreground text-background px-5 py-2 text-xs uppercase tracking-[0.15em] disabled:opacity-40">
          {busy ? "Consultando…" : `Consultar ${cnpjs.length || ""} CNPJ${cnpjs.length === 1 ? "" : "s"}`}
        </button>
        {cnpjs.length > 20 && <span className="text-xs text-destructive">Máximo de 20 por vez</span>}
        <span className="text-xs text-muted-foreground">Traz razão social, atividade, porte, situação, telefone, e-mail e sócios cadastrados na Receita.</span>
      </div>
      {errors.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
    </div>
  );
}

function Details({ p, extra, onChange }: { p: Prospect; extra: Extra; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(p.notes ?? "");
  const scan = async () => {
    setBusy(true);
    try {
      const r = await scanWebsite({ data: { id: p.id } });
      toast.success(r.emails.length || r.phones.length ? `Encontrado: ${r.emails.length} e-mail(s), ${r.phones.length} telefone(s)` : "Nenhum contato público no site");
      onChange();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="border border-border bg-[color:var(--muted)]/20 p-4 grid md:grid-cols-3 gap-5 text-xs">
      <div className="space-y-1">
        <div className="eyebrow mb-1">Cadastro</div>
        {p.legal_name && <div>Razão social: {p.legal_name}</div>}
        {p.cnpj && <div>CNPJ: {p.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}</div>}
        {extra.situacao && <div>Situação: {extra.situacao}</div>}
        {extra.abertura && <div>Abertura: {new Date(extra.abertura + "T12:00").toLocaleDateString("pt-BR")}</div>}
        {extra.capital_social ? <div>Capital social: {extra.capital_social.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div> : null}
        {p.address && <div>{p.address}</div>}
        {extra.maps_url && <a href={extra.maps_url} target="_blank" rel="noreferrer" className="underline">Ver no Google Maps</a>}
        {p.search && <div className="text-muted-foreground">Busca: {p.search}</div>}
      </div>
      <div className="space-y-1">
        <div className="eyebrow mb-1">Pessoas e contatos</div>
        {extra.socios?.length ? extra.socios.map((s) => <div key={s.nome}>{s.nome} <span className="text-muted-foreground">· {s.cargo}</span></div>) : <div className="text-muted-foreground">Sócios: consulte pelo CNPJ.</div>}
        {extra.site && (
          <div className="pt-2 space-y-0.5">
            {extra.site.emails.map((e) => <div key={e}><a href={`mailto:${e}`} className="underline">{e}</a></div>)}
            {extra.site.phones.map((t) => <div key={t}>{t}</div>)}
            {extra.site.social.map((s) => <div key={s}><a href={s} target="_blank" rel="noreferrer" className="underline">{s.replace(/^https:\/\//, "")}</a></div>)}
            {!extra.site.emails.length && !extra.site.phones.length && !extra.site.social.length && <div className="text-muted-foreground">Site sem contatos públicos.</div>}
          </div>
        )}
        {p.website && (
          <button onClick={scan} disabled={busy} className="border border-border px-3 py-1.5 mt-2 disabled:opacity-40">
            {busy ? "Lendo o site…" : extra.site ? "Buscar de novo no site" : "Buscar contatos no site"}
          </button>
        )}
      </div>
      <div>
        <div className="eyebrow mb-1">Anotação</div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={1000} placeholder="Por que é (ou não) um bom alvo…" className={`${input} w-full`} />
        <button onClick={async () => {
          const { error } = await supabase.from("prospects").update({ notes: notes.trim() || null }).eq("id", p.id);
          if (error) toast.error(error.message); else { toast.success("Anotação salva"); onChange(); }
        }} className="border border-border px-3 py-1.5 mt-1">Salvar anotação</button>
      </div>
    </div>
  );
}

function Convert({ p, onClose, onDone }: { p: Prospect; onClose: () => void; onDone: () => void }) {
  const extra = (p.extra ?? {}) as Extra;
  const emails = [...new Set([p.email, ...(extra.site?.emails ?? [])].filter((e): e is string => !!e))];
  const [busy, setBusy] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const value = parseBRL(s("value"));
    if (Number.isNaN(value)) return toast.error("Valor inválido");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id ?? null;
      const name = s("company");
      // Empresa: reaproveita pelo nome ou CNPJ; senão cadastra com os dados extraídos
      const byCnpj = p.cnpj ? (await supabase.from("corporate_accounts").select("id").eq("cnpj", p.cnpj).limit(1)).data?.[0] : undefined;
      const byName = byCnpj ? undefined : (await supabase.from("corporate_accounts").select("id").ilike("name", name.replace(/[%_\\]/g, "\\$&")).limit(1)).data?.[0];
      let accountId = byCnpj?.id ?? byName?.id ?? null;
      if (!accountId) {
        const { data: acc, error } = await supabase.from("corporate_accounts").insert({
          name, cnpj: p.cnpj, city: p.city, website: p.website, size: p.size?.slice(0, 40) ?? null, owner_id: me,
          notes: [p.category && `Atividade: ${p.category}`, p.address && `Endereço: ${p.address}`, p.notes].filter(Boolean).join("\n") || null,
          tags: ["Prospecção"],
        }).select("id").single();
        if (error) throw error;
        accountId = acc.id;
      }
      const { data: lead, error } = await supabase.from("leads").insert({
        kind: "manual", account_id: accountId, company: name,
        name: s("name") || null, email: s("email").toLowerCase(), phone: s("phone") || null,
        event_type: s("event_type") || null, event_city: p.city, value_cents: value, owner_id: me, tags: ["Prospecção"],
        payload: { origem: p.source === "google" ? "Extrator · Google Maps" : "Extrator · CNPJ", ...(s("mensagem") ? { mensagem: s("mensagem") } : {}) },
        next_action: "Primeiro contato", next_action_at: new Date(Date.now() + 86_400_000).toISOString(),
      }).select("id").single();
      if (error) throw error;
      await supabase.from("prospects").update({ status: "convertido", lead_id: lead.id }).eq("id", p.id);
      toast.success("Oportunidade criada no funil");
      setLeadId(lead.id);
    } catch (err) {
      toast.error((err as Error).message.includes("check") ? "Confira o e-mail e os campos" : (err as Error).message);
    } finally { setBusy(false); }
  };

  if (leadId) return (
    <Modal title="Pronto" onClose={onDone}>
      <p className="text-sm mb-5">{p.name} entrou no funil como <b>Novo</b>, com próximo passo “Primeiro contato” para amanhã.</p>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="border border-border px-4 py-2 text-xs">Continuar prospectando</button>
        <Link to="/crm/leads/$id" params={{ id: leadId }} className="bg-foreground text-background px-5 py-2 text-xs">Abrir oportunidade</Link>
      </div>
    </Modal>
  );

  return (
    <Modal title="Transformar em oportunidade" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Empresa"><input name="company" required maxLength={120} defaultValue={p.name} className={`${input} w-full`} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contato (nome)">
            <input name="name" list="socios" maxLength={120} placeholder="Quem você vai abordar" className={`${input} w-full`} />
            <datalist id="socios">{(extra.socios ?? []).map((s) => <option key={s.nome} value={s.nome} />)}</datalist>
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" required list="emails" maxLength={200} defaultValue={emails[0] ?? ""} className={`${input} w-full`} />
            <datalist id="emails">{emails.map((e) => <option key={e} value={e} />)}</datalist>
          </Field>
          <Field label="Telefone / WhatsApp"><input name="phone" maxLength={40} defaultValue={p.phone ?? extra.site?.phones[0] ?? ""} className={`${input} w-full`} /></Field>
          <Field label="Valor estimado (R$)"><input name="value" inputMode="decimal" placeholder="0,00" className={`${input} w-full`} /></Field>
        </div>
        <Field label="Formato a oferecer"><input name="event_type" maxLength={120} placeholder="Workshop de perfumaria, presente corporativo…" className={`${input} w-full`} /></Field>
        <Field label="Observação"><textarea name="mensagem" rows={2} maxLength={2000} defaultValue={p.notes ?? ""} className={`${input} w-full`} /></Field>
        {!emails.length && <p className="text-xs text-muted-foreground">Sem e-mail encontrado: use “Buscar contatos no site” nos detalhes ou informe um.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
          <button disabled={busy} className="bg-foreground text-background px-5 py-2 text-xs disabled:opacity-40">{busy ? "Criando…" : "Criar oportunidade"}</button>
        </div>
      </form>
    </Modal>
  );
}
