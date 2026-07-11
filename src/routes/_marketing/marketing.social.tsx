import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Youtube, Facebook, Linkedin } from "lucide-react";
import { PageHeader } from "@/components/module-shell";

const CHANNELS = [
  { label: "Instagram", icon: Instagram },
  { label: "TikTok", icon: Instagram },
  { label: "Pinterest", icon: Instagram },
  { label: "YouTube", icon: Youtube },
  { label: "Facebook", icon: Facebook },
  { label: "LinkedIn", icon: Linkedin },
];

export const Route = createFileRoute("/_marketing/marketing/social")({
  head: () => ({ meta: [{ title: "Social — Marketing" }] }),
  component: () => (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Marketing" title="Social Analytics" description="Crescimento, engajamento e desempenho por rede." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {CHANNELS.map(({ label, icon: Icon }) => (
          <div key={label} className="bg-background p-6 min-h-[160px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <div className="eyebrow">Rede</div>
                <div className="font-display text-2xl mt-1">{label}</div>
              </div>
              <Icon className="size-5 text-muted-foreground" strokeWidth={1.2} />
            </div>
            <button className="editorial-link self-start mt-4">Conectar</button>
          </div>
        ))}
      </div>
    </div>
  ),
});
