import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { SiteContentEditor } from "@/components/site-editor";
import { pageDef } from "@/lib/site-schema";

export const Route = createFileRoute("/_studio/studio/paginas/$slug")({ component: PageEditor });

function PageEditor() {
  const { slug } = Route.useParams();
  const def = pageDef(slug);
  const [preview, setPreview] = useState(true);
  const [tick, setTick] = useState(0);

  if (!def) return <p>Página não encontrada. <Link to="/studio/paginas" className="underline">Voltar</Link></p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <Link to="/studio/paginas" className="eyebrow text-muted-foreground hover:text-foreground">← Páginas</Link>
          <h1 className="font-display text-4xl mt-2">{def.title}</h1>
          <div className="text-xs text-muted-foreground mt-1">{def.path}</div>
        </div>
        <button onClick={() => setPreview((v) => !v)} className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 border ${preview ? "border-foreground" : "border-border text-muted-foreground"}`}>
          <Eye className="size-3.5" /> Prévia
        </button>
      </div>

      <div className="grid gap-6 border-t border-border pt-6" style={{ gridTemplateColumns: preview ? "minmax(360px, 520px) 1fr" : "minmax(0, 760px)" }}>
        <div className="min-w-0">
          {/* Ao salvar, a prévia recarrega com o conteúdo publicado */}
          <SiteContentEditor page={slug} onSaved={() => setTick((t) => t + 1)} />
        </div>
        {preview && (
          <div className="border border-border bg-[color:var(--muted)]/20 sticky top-6 h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background">
              <div className="eyebrow text-muted-foreground">Prévia ao vivo</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setTick((t) => t + 1)} className="text-xs text-muted-foreground hover:text-foreground" aria-label="Recarregar prévia"><RotateCcw className="size-3.5" /></button>
                <a href={def.path} target="_blank" rel="noreferrer" className="text-xs eyebrow border-b border-foreground">Abrir →</a>
              </div>
            </div>
            <iframe key={tick} src={`${def.path}${def.path.includes("?") ? "&" : "?"}preview=${tick}`} title="Prévia da página" className="flex-1 w-full bg-background" />
          </div>
        )}
      </div>
    </div>
  );
}
