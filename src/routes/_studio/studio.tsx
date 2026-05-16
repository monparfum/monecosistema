import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_studio/studio")({ component: StudioHome });

function StudioHome() {
  const { data: pages } = useQuery({
    queryKey: ["studio-pages-count"],
    queryFn: async () => (await supabase.from("pages").select("id,status")).data ?? [],
  });
  const { data: media } = useQuery({
    queryKey: ["studio-media-count"],
    queryFn: async () => (await supabase.from("media_assets").select("id")).data ?? [],
  });

  const total = pages?.length ?? 0;
  const published = pages?.filter((p) => p.status === "published").length ?? 0;

  return (
    <div className="space-y-16">
      <div>
        <div className="eyebrow mb-4">Studio · Mon Parfum</div>
        <h1 className="font-display text-[clamp(3rem,5vw,5rem)] leading-[0.95]">
          Componha o site<br /><em className="italic text-muted-foreground">visualmente.</em>
        </h1>
        <p className="mt-8 max-w-xl text-muted-foreground leading-relaxed">
          Edite páginas, blocos editoriais e mídias da maison. Tudo o que você publicar aqui aparece imediatamente no site.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 border-t border-border pt-12">
        <Card label="Páginas" value={String(total)} sub={`${published} publicadas`} to="/studio/paginas" cta="Gerenciar páginas" />
        <Card label="Mídia" value={String(media?.length ?? 0)} sub="arquivos enviados" to="/studio/midia" cta="Abrir biblioteca" />
        <Card label="Catálogo" value="—" sub="produtos e pedidos" to="/admin" cta="Ir para comércio" />
      </div>
    </div>
  );
}

function Card({ label, value, sub, to, cta }: { label: string; value: string; sub: string; to: string; cta: string }) {
  return (
    <div className="border border-border p-8 space-y-6">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-5xl">{value}</div>
      <div className="text-sm text-muted-foreground">{sub}</div>
      <Link to={to} className="editorial-link text-xs inline-block">{cta}</Link>
    </div>
  );
}
