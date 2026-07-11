import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton-row";
import { useState } from "react";
import { toast } from "sonner";

const CHANNELS = ["instagram", "tiktok", "email", "whatsapp", "pinterest", "youtube", "outro"] as const;
const STATUSES = ["draft", "scheduled", "active", "paused", "done"] as const;

export const Route = createFileRoute("/_marketing/marketing/campanhas")({
  head: () => ({ meta: [{ title: "Campanhas — Marketing" }] }),
  component: Campanhas,
});

function Campanhas() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await supabase.from("campaigns").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Campanha removida"); qc.invalidateQueries({ queryKey: ["campaigns"] }); },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      <PageHeader
        eyebrow="Marketing"
        title="Campanhas"
        description="Planejamento editorial e ativações por canal."
        actions={<button onClick={() => setOpen(true)} className="bg-foreground text-background px-5 py-2.5 text-xs uppercase tracking-[0.15em]">Nova campanha</button>}
      />

      {open && <NewCampaign onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["campaigns"] })} />}

      {isLoading ? (
        <div className="border-y border-border divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={4} />)}
        </div>
      ) : !data?.length ? (
        <EmptyState eyebrow="Vazio" title="Nenhuma campanha ainda." description="Crie a primeira campanha para começar o planejamento." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {data.map((c) => (
            <div key={c.id} className="py-5 grid grid-cols-[1.4fr_1fr_1fr_auto] gap-6 items-center">
              <div>
                <div className="eyebrow">{c.channel}</div>
                <div className="font-display text-xl">{c.name}</div>
                {c.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</div>}
              </div>
              <div className="text-sm">
                <div className="eyebrow">Período</div>
                <div>{c.starts_at ? new Date(c.starts_at).toLocaleDateString("pt-BR") : "—"} → {c.ends_at ? new Date(c.ends_at).toLocaleDateString("pt-BR") : "—"}</div>
              </div>
              <select
                value={c.status}
                onChange={(e) => updateStatus.mutate({ id: c.id, status: e.target.value })}
                className="bg-transparent border border-border px-3 py-2 text-sm"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => { if (confirm("Remover campanha?")) remove.mutate(c.id); }} className="eyebrow text-muted-foreground hover:text-foreground">Apagar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewCampaign({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<typeof CHANNELS[number]>("instagram");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase.from("campaigns").insert({
        name,
        channel,
        status: "draft",
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        description: description || null,
        created_by: userRes.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Campanha criada"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
        className="bg-background border border-border max-w-lg w-full p-8 space-y-5"
      >
        <div>
          <div className="eyebrow">Marketing</div>
          <h2 className="font-display text-3xl">Nova campanha</h2>
        </div>
        <label className="block">
          <div className="eyebrow mb-2">Nome</div>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <div className="eyebrow mb-2">Canal</div>
          <select value={channel} onChange={(e) => setChannel(e.target.value as typeof CHANNELS[number])} className="w-full bg-transparent border border-border px-3 py-2 text-sm">
            {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <div className="eyebrow mb-2">Início</div>
            <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <div className="eyebrow mb-2">Fim</div>
            <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="block">
          <div className="eyebrow mb-2">Descrição</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent border border-border px-3 py-2 text-sm min-h-[80px]" />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2 text-xs uppercase tracking-[0.15em]">Cancelar</button>
          <button type="submit" disabled={create.isPending} className="bg-foreground text-background px-4 py-2 text-xs uppercase tracking-[0.15em] disabled:opacity-40">Criar</button>
        </div>
      </form>
    </div>
  );
}
