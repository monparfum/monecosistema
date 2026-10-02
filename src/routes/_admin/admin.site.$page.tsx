import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteContentEditor } from "@/components/site-editor";
import { pageDef } from "@/lib/site-schema";

export const Route = createFileRoute("/_admin/admin/site/$page")({ component: EditPage });

function EditPage() {
  const { page } = Route.useParams();
  const def = pageDef(page);
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link to="/admin/site" className="eyebrow text-muted-foreground hover:text-foreground">← Páginas do site</Link>
        <div className="flex items-end justify-between gap-4 mt-2">
          <h1 className="font-display text-4xl">{def?.title ?? page}</h1>
          <div className="flex gap-4 text-sm">
            <Link to="/studio/paginas/$slug" params={{ slug: page }} className="underline">Editar com prévia ao vivo</Link>
            {def && <a href={def.path} target="_blank" rel="noreferrer" className="underline">Ver no site ↗</a>}
          </div>
        </div>
      </div>
      <SiteContentEditor page={page} />
    </div>
  );
}
