import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Youtube, Facebook, Linkedin, Music2, Camera } from "lucide-react";
import { PageHeader } from "@/components/module-shell";

const CHANNELS = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "tiktok", label: "TikTok", icon: Music2 },
  { id: "pinterest", label: "Pinterest", icon: Camera },
  { id: "youtube", label: "YouTube", icon: Youtube },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
];

export const Route = createFileRoute("/_marketing/marketing/social")({
  head: () => ({ meta: [{ title: "Social — Marketing" }] }),
  component: Social,
});

function Social() {
  const { data } = useQuery({
    queryKey: ["social-campaigns"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("campaigns")
        .select("id, name, channel, status, starts_at, ends_at")
        .order("starts_at", { ascending: false, nullsFirst: false });
      const byChannel: Record<string, typeof rows> = {};
      (rows ?? []).forEach((c) => {
        const key = (c.channel ?? "").toLowerCase();
        (byChannel[key] ??= []).push(c);
      });
      return byChannel;
    },
  });

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Marketing"
        title="Social"
        description="Campanhas por rede. Publicação assistida quando um provedor for conectado."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {CHANNELS.map(({ id, label, icon: Icon }) => {
          const campaigns = data?.[id] ?? [];
          const active = campaigns.filter((c) => c.status === "active").length;
          return (
            <div key={id} className="bg-background p-6 min-h-[200px] flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="eyebrow">Rede</div>
                  <div className="font-display text-2xl mt-1">{label}</div>
                </div>
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.2} />
              </div>
              <div className="mt-4 flex gap-6 text-xs">
                <div>
                  <span className="font-display text-2xl">{campaigns.length}</span>
                  <span className="text-muted-foreground ml-1">campanhas</span>
                </div>
                <div>
                  <span className="font-display text-2xl text-[color:var(--gold)]">{active}</span>
                  <span className="text-muted-foreground ml-1">ativas</span>
                </div>
              </div>
              {campaigns[0] ? (
                <div className="mt-4 border-t border-border pt-3 flex-1">
                  <div className="eyebrow">Recente</div>
                  <div className="font-display text-base mt-1 line-clamp-2">{campaigns[0].name}</div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-4 flex-1">Sem campanhas neste canal.</p>
              )}
              <Link to="/marketing/campanhas" className="editorial-link text-xs mt-3">Gerenciar →</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
