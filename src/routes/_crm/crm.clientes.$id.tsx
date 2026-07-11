import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { formatBRL } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_crm/crm/clientes/$id")({
  head: () => ({ meta: [{ title: "Cliente — CRM" }] }),
  component: CrmCliente,
});

function CrmCliente() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["crm-cliente", id],
    queryFn: async () => {
      const [profile, orders, enrollments, notes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("orders").select("*, order_items(product_name, quantity)").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("enrollments").select("id, created_at, status, products(name, brand)").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("customer_notes").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
      ]);
      return { profile: profile.data, orders: orders.data ?? [], enrollments: enrollments.data ?? [], notes: notes.data ?? [] };
    },
  });

  const addNote = useMutation({
    mutationFn: async (body: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("customer_notes").insert({ customer_id: id, author_user_id: userRes.user.id, body });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      toast.success("Observação registrada");
      qc.invalidateQueries({ queryKey: ["crm-cliente", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("customer_notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-cliente", id] }),
  });

  if (isLoading) return <div className="text-muted-foreground">Carregando…</div>;
  if (!data?.profile) return <EmptyState title="Cliente não encontrado." />;

  const paid = data.orders.filter((o) => o.status !== "cancelled" && o.status !== "pending_payment");
  const ltv = paid.reduce((s, o) => s + o.total_cents, 0);
  const last = data.orders[0]?.created_at;

  return (
    <div className="space-y-10 max-w-[1200px]">
      <div>
        <Link to="/crm/clientes" className="eyebrow text-muted-foreground hover:text-foreground">← Clientes</Link>
        <PageHeader eyebrow="Ficha 360°" title={data.profile.full_name || "Cliente sem nome"} description={data.profile.phone ?? ""} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <Stat label="Pedidos" value={data.orders.length} />
        <Stat label="LTV" value={formatBRL(ltv)} />
        <Stat label="Última compra" value={last ? new Date(last).toLocaleDateString("pt-BR") : "—"} />
        <Stat label="Segmento" value={ltv >= 100_000 ? "VIP" : "Regular"} />
      </div>

      <section>
        <h2 className="font-display text-2xl mb-4">Histórico de pedidos</h2>
        {data.orders.length === 0 ? (
          <EmptyState eyebrow="Sem compras" title="Este cliente ainda não realizou pedidos." />
        ) : (
          <div className="border-y border-border divide-y divide-border">
            {data.orders.map((o) => (
              <Link key={o.id} to="/ops/pedidos/$id" params={{ id: o.id }} className="py-4 flex items-center justify-between gap-6 hover:bg-[color:var(--muted)] px-2 -mx-2 transition-colors">
                <div>
                  <div className="eyebrow">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.status}</div>
                  <div className="font-display text-lg">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">{o.order_items.map((i) => `${i.product_name} ×${i.quantity}`).join(" · ")}</div>
                </div>
                <div className="font-display text-lg">{formatBRL(o.total_cents)}</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-px bg-border border border-border">
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Cursos matriculados</div>
          {data.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum curso adquirido ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.enrollments.map((e) => (
                <li key={e.id} className="flex justify-between items-baseline">
                  <span className="font-display italic">{e.products?.name}</span>
                  <span className="eyebrow text-muted-foreground">{e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Experiências & Eventos</div>
          <p className="text-sm text-muted-foreground">Nenhuma experiência registrada ainda.</p>
        </div>
        <div className="bg-background p-6">
          <div className="eyebrow mb-2">Quiz Olfativo</div>
          <p className="text-sm text-muted-foreground">Aguardando integração futura.</p>
        </div>
        <div className="bg-background p-6">
          <div className="eyebrow mb-3">Observações</div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (note.trim()) addNote.mutate(note.trim()); }}
            className="space-y-2 mb-4"
          >
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicionar nota interna…"
              className="w-full bg-transparent border border-border px-3 py-2 text-sm min-h-[70px]"
            />
            <button
              type="submit"
              disabled={addNote.isPending || !note.trim()}
              className="border border-foreground px-4 py-2 text-xs uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-colors disabled:opacity-40"
            >
              Registrar
            </button>
          </form>
          {data.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem notas.</p>
          ) : (
            <ul className="space-y-3">
              {data.notes.map((n) => (
                <li key={n.id} className="border-t border-border pt-3 text-sm">
                  <div className="flex justify-between eyebrow text-muted-foreground">
                    <span>{new Date(n.created_at).toLocaleString("pt-BR")}</span>
                    <button onClick={() => removeNote.mutate(n.id)} className="hover:text-foreground">Apagar</button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-background p-6">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-2xl mt-2 leading-none">{value}</div>
    </div>
  );
}
