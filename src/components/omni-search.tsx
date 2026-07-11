import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Hit = { kind: string; label: string; hint: string; to: string };

export function OmniSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, []);

  const term = q.trim();
  const { data: hits, isLoading } = useQuery({
    queryKey: ["omni", term],
    enabled: term.length >= 2,
    queryFn: async (): Promise<Hit[]> => {
      const like = `%${term}%`;
      const [orders, profiles, products, campaigns] = await Promise.all([
        supabase.from("orders").select("id, order_number, email, status, total_cents").or(`order_number.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("profiles").select("id, full_name, phone").or(`full_name.ilike.${like},phone.ilike.${like}`).limit(5),
        supabase.from("products").select("id, name, brand, slug").ilike("name", like).limit(5),
        supabase.from("campaigns").select("id, name, channel, status").ilike("name", like).limit(5),
      ]);
      const out: Hit[] = [];
      (orders.data ?? []).forEach((o) => out.push({
        kind: "Pedido",
        label: `#${o.order_number}`,
        hint: `${o.email} · ${o.status}`,
        to: `/ops/pedidos/${o.id}`,
      }));
      (profiles.data ?? []).forEach((p) => out.push({
        kind: "Cliente",
        label: p.full_name || "Sem nome",
        hint: p.phone ?? "—",
        to: `/crm/clientes/${p.id}`,
      }));
      (products.data ?? []).forEach((p) => out.push({
        kind: "Produto",
        label: p.name,
        hint: p.brand ?? "Mon Parfum",
        to: `/loja/${p.slug}`,
      }));
      (campaigns.data ?? []).forEach((c) => out.push({
        kind: "Campanha",
        label: c.name,
        hint: `${c.channel ?? "—"} · ${c.status ?? "—"}`,
        to: `/marketing/campanhas`,
      }));
      return out;
    },
  });

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
      >
        <Search className="size-3.5" strokeWidth={1.5} />
        <span>Buscar…</span>
        <span className="ml-auto font-mono text-[10px] border border-border px-1">⌘K</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-background border border-border shadow-2xl w-[380px]">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" strokeWidth={1.5} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pedido, cliente, produto, campanha…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button onClick={() => setOpen(false)}><X className="size-4 text-muted-foreground" /></button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {term.length < 2 ? (
              <p className="p-4 text-xs text-muted-foreground italic">Digite ao menos 2 caracteres para buscar em Commerce, CRM, Ops e Marketing.</p>
            ) : isLoading ? (
              <p className="p-4 text-xs text-muted-foreground">Procurando…</p>
            ) : !hits?.length ? (
              <p className="p-4 text-xs text-muted-foreground">Nada encontrado.</p>
            ) : (
              hits.map((h, i) => (
                <Link
                  key={`${h.kind}-${i}`}
                  to={h.to}
                  onClick={() => { setOpen(false); setQ(""); }}
                  className="block px-4 py-3 border-b border-border last:border-0 hover:bg-[color:var(--cream)]/40"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display text-base truncate">{h.label}</div>
                    <span className="eyebrow text-[10px] shrink-0">{h.kind}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{h.hint}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
