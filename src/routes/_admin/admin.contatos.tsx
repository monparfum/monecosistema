import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin/admin/contatos")({ component: Contatos });

const KINDS: Record<string, string> = { quiz: "Quiz", atelier: "Atelier Privé", corporativo: "Corporativo", contato: "Contato", newsletter: "Newsletter" };
const STATUS: Record<string, string> = { novo: "Novo", em_contato: "Em contato", concluido: "Concluído" };

function Contatos() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads", kind],
    queryFn: async () => {
      let q = supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-leads"] });
  };

  const exportCsv = () => {
    const rows = (data ?? []).map((l) => [l.created_at, KINDS[l.kind] ?? l.kind, l.name ?? "", l.email, l.phone ?? "", JSON.stringify(l.payload), STATUS[l.status] ?? l.status]);
    const csv = [["data", "origem", "nome", "email", "telefone", "detalhes", "status"], ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `contatos-mon-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-2">Site</div>
          <h1 className="font-display text-4xl">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">Quiz, Atelier Privé, propostas corporativas, contato e newsletter.</p>
        </div>
        <div className="flex gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-border bg-transparent px-3 py-2 text-sm">
            <option value="">Todas as origens</option>
            {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={exportCsv} disabled={!data?.length} className="border border-foreground px-4 py-2 text-sm disabled:opacity-40">Exportar CSV</button>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !data?.length ? <p className="text-muted-foreground">Nenhum contato ainda.</p> : (
        <div className="border-y border-border divide-y divide-border">
          {data.map((l) => (
            <div key={l.id} className="py-4 grid md:grid-cols-[160px_1fr_auto] gap-4 items-start text-sm">
              <div>
                <div className="eyebrow">{KINDS[l.kind] ?? l.kind}</div>
                <div className="text-muted-foreground text-xs mt-1">{new Date(l.created_at).toLocaleString("pt-BR")}</div>
              </div>
              <div>
                <div className="font-medium">{l.name || "—"} · <a className="underline" href={`mailto:${l.email}`}>{l.email}</a>{l.phone && <> · <a className="underline" href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{l.phone}</a></>}</div>
                {l.payload && typeof l.payload === "object" && Object.keys(l.payload).length > 0 && (
                  <dl className="mt-1 text-xs text-muted-foreground grid grid-cols-[auto_1fr] gap-x-3">
                    {Object.entries(l.payload as Record<string, unknown>).map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd className="text-foreground">{String(v)}</dd></Fragment>)}
                  </dl>
                )}
              </div>
              <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} className="border border-border bg-transparent px-2 py-1 text-xs">
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
