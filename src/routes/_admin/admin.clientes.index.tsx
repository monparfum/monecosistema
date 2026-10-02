import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listCustomers } from "@/lib/customers.functions";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes — E-commerce" }] }),
  component: AdminCustomers,
});

const input = "border border-border bg-background px-3 py-2 text-sm";
const FILTERS = [
  ["", "Todos"], ["compradores", "Compraram"], ["recorrentes", "2+ compras"], ["sem_compra", "Cadastrados sem compra"], ["pendentes", "Com pedido não pago"],
] as const;
type Sort = "gasto" | "recente" | "cadastro" | "nome";

function AdminCustomers() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("gasto");
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-customers"], queryFn: () => listCustomers() });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = data.filter((c) =>
      (filter !== "compradores" || c.paidOrders > 0) && (filter !== "recorrentes" || c.paidOrders >= 2) &&
      (filter !== "sem_compra" || c.paidOrders === 0) && (filter !== "pendentes" || c.pending > 0) &&
      (!term || [c.name, c.email, c.phone].some((v) => v?.toLowerCase().includes(term))));
    const by: Record<Sort, (a: typeof rows[number], b: typeof rows[number]) => number> = {
      gasto: (a, b) => b.spentCents - a.spentCents || b.createdAt.localeCompare(a.createdAt),
      recente: (a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""),
      cadastro: (a, b) => b.createdAt.localeCompare(a.createdAt),
      nome: (a, b) => (a.name || a.email).localeCompare(b.name || b.email, "pt-BR"),
    };
    return rows.sort(by[sort]);
  }, [data, filter, q, sort]);

  const buyers = data.filter((c) => c.paidOrders > 0);
  const revenue = buyers.reduce((s, c) => s + c.spentCents, 0);

  const exportCsv = () => {
    const rows = list.map((c) => [c.name ?? "", c.email, c.phone ?? "", c.paidOrders, (c.spentCents / 100).toFixed(2).replace(".", ","),
      c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "", new Date(c.createdAt).toLocaleDateString("pt-BR")]);
    const csv = [["nome", "email", "telefone", "compras", "total gasto", "última compra", "cadastro"], ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `clientes-mon-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <div className="eyebrow mb-2">Pessoas</div>
          <h1 className="font-display text-4xl">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Quem tem conta na loja. Clientes corporativos ficam no CRM.</p>
        </div>
        <button onClick={exportCsv} disabled={!list.length} className="border border-border px-4 py-2 text-xs disabled:opacity-40">Exportar CSV</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Kpi label="Cadastrados" value={data.length} />
        <Kpi label="Já compraram" value={buyers.length} />
        <Kpi label="Recorrentes" value={buyers.filter((c) => c.paidOrders >= 2).length} />
        <Kpi label="Gasto médio por cliente" value={buyers.length ? formatBRL(Math.round(revenue / buyers.length)) : "—"} />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 text-xs border ${filter === k ? "border-foreground bg-foreground text-background" : "border-border"}`}>{l}</button>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome, e-mail, telefone…" className={`${input} w-72 ml-2`} />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${input} ml-auto`}>
          <option value="gasto">Maior gasto</option><option value="recente">Compra mais recente</option>
          <option value="cadastro">Cadastro mais recente</option><option value="nome">Nome</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : !list.length ? <p className="text-sm text-muted-foreground">Nenhum cliente.</p> : (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left eyebrow text-muted-foreground border-b border-border">
              <tr>{["Cliente", "Telefone", "Compras", "Total gasto", "Última compra", "Cadastro"].map((h) => <th key={h} className="p-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((c) => (
                <tr key={c.id} onClick={() => navigate({ to: "/admin/clientes/$id", params: { id: c.id } })} className="cursor-pointer hover:bg-[color:var(--muted)]/40">
                  <td className="p-3"><div className="font-medium">{c.name || "—"}</div><div className="text-xs text-muted-foreground">{c.email}</div></td>
                  <td className="p-3">{c.phone ?? "—"}</td>
                  <td className="p-3">{c.paidOrders}{c.pending > 0 && <span className="text-xs text-destructive"> · {c.pending} não pago</span>}</td>
                  <td className="p-3 whitespace-nowrap">{c.spentCents ? formatBRL(c.spentCents) : "—"}</td>
                  <td className="p-3">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("pt-BR") : "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="bg-background p-6"><div className="eyebrow">{label}</div><div className="font-display text-3xl mt-2">{value}</div></div>;
}
