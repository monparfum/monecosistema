import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { MonPage } from "@/components/mon/page";
import { parseBody, readingMinutes, type Inline } from "@/lib/post-body";
import { categoriesQuery, formatDate, KINDS, postQuery, postsQuery, type GalleryItem, type Post, type PostKind } from "@/lib/posts";

function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.t === "b" ? <b key={i}>{p.v}</b>
        : p.t === "a" ? (p.href.startsWith("/") ? <a key={i} href={p.href}>{p.v}</a> : <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.v}</a>)
        : <span key={i}>{p.v}</span>,
      )}
    </>
  );
}

export function PostBody({ text }: { text: string }) {
  return (
    <div className="m-post-body">
      {parseBody(text).map((b, i) => {
        if (b.t === "h2" || b.t === "h3") return b.t === "h2" ? <h2 key={i}>{b.v}</h2> : <h3 key={i}>{b.v}</h3>;
        if (b.t === "ul") return <ul key={i}>{b.items.map((it, j) => <li key={j}><InlineText parts={it} /></li>)}</ul>;
        if (b.t === "img") return <figure key={i}><img src={b.src} alt={b.alt} loading="lazy" />{b.alt && <figcaption>{b.alt}</figcaption>}</figure>;
        return <p key={i}>{b.lines.map((l, j) => <span key={j}>{j > 0 && <br />}<InlineText parts={l} /></span>)}</p>;
      })}
    </div>
  );
}

// Galeria: miniaturas em grade; clique abre a foto grande (<dialog> nativo: Esc fecha, setas navegam)
export function PostGallery({ items }: { items: GalleryItem[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState<number | null>(null);
  const n = items.length;
  const go = (d: number) => setI((v) => (v === null ? v : (v + d + n) % n));
  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (i !== null && !dlg.open) dlg.showModal();
    if (i === null && dlg.open) dlg.close();
  }, [i]);
  if (!n) return null;
  const cur = i !== null ? items[i] : null;
  return (
    <section className="m-gallery" aria-label="Galeria de fotos">
      <h2>Galeria de fotos</h2>
      <ul>
        {items.map((g, k) => (
          <li key={g.url + k}>
            <button type="button" onClick={() => setI(k)} aria-label={`Ampliar foto ${k + 1} de ${n}${g.alt ? `: ${g.alt}` : ""}`}>
              <img src={g.url} alt={g.alt} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <dialog ref={ref} className="m-lightbox" onClose={() => setI(null)} onClick={(e) => e.target === e.currentTarget && setI(null)}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }} aria-label="Foto ampliada">
        {cur && (
          <figure>
            <img src={cur.url} alt={cur.alt} />
            <figcaption><span>{cur.alt}</span><span className="m-mono">{(i ?? 0) + 1} / {n}</span></figcaption>
          </figure>
        )}
        {n > 1 && <>
          <button type="button" className="nav prev" onClick={() => go(-1)} aria-label="Foto anterior">‹</button>
          <button type="button" className="nav next" onClick={() => go(1)} aria-label="Próxima foto">›</button>
        </>}
        <button type="button" className="close" onClick={() => setI(null)} aria-label="Fechar">×</button>
      </dialog>
    </section>
  );
}

const postLink = (p: Post) => `${KINDS[p.kind].base}/${p.slug}`;

export function PostCard({ p, big = false }: { p: Post; big?: boolean }) {
  return (
    <article className={`m-post-card${big ? " big" : ""}`}>
      <a href={postLink(p)} className="img" tabIndex={-1} aria-hidden="true">
        {p.cover_url ? <img src={p.cover_url} alt="" loading="lazy" /> : <span>{KINDS[p.kind].label}</span>}
      </a>
      <div className="body">
        <div className="m-mono meta">
          {p.category && <a href={`${KINDS[p.kind].base}/categoria/${p.category.slug}`}>{p.category.name}</a>}
          {p.published_at && <time dateTime={p.published_at}>{formatDate(p.published_at)}</time>}
          {(p.gallery?.length ?? 0) > 0 && <span>{p.gallery.length} fotos</span>}
        </div>
        <h3><a href={postLink(p)}>{p.title}</a></h3>
        {p.excerpt && <p>{p.excerpt}</p>}
      </div>
    </article>
  );
}

function CategoryNav({ kind, active }: { kind: PostKind; active?: string }) {
  const { data: cats = [] } = useQuery(categoriesQuery(kind));
  if (!cats.length) return null;
  const base = KINDS[kind].base;
  return (
    <nav className="m-post-cats" aria-label={`Categorias de ${KINDS[kind].plural}`}>
      <a href={base} aria-current={!active ? "page" : undefined}>Todas</a>
      {cats.map((c) => <a key={c.id} href={`${base}/categoria/${c.slug}`} aria-current={active === c.slug ? "page" : undefined}>{c.name}</a>)}
    </nav>
  );
}

// Listagem de um tipo. Em Notícias, o Blog aparece depois (notícias primeiro).
export function PostsIndex({ kind, categoria }: { kind: PostKind; categoria?: string }) {
  const k = KINDS[kind];
  const { data: posts = [], isLoading } = useQuery(postsQuery(kind, { categoria }));
  const { data: cats = [] } = useQuery(categoriesQuery(kind));
  const cat = cats.find((c) => c.slug === categoria);
  const { data: blog = [] } = useQuery({ ...postsQuery("blog", { limit: 3 }), enabled: kind === "noticia" && !categoria });
  const [first, ...rest] = posts;
  return (
    <MonPage>
      <div className="m-wrap">
        <section className="m-sec">
          <nav className="m-crumbs" aria-label="Você está em">
            <Link to="/">Início</Link> / {cat ? <><a href={k.base}>{k.plural}</a> / <span>{cat.name}</span></> : <span>{k.plural}</span>}
          </nav>
          <h1>{cat ? cat.name : k.plural}</h1>
          <p className="m-lead" style={{ marginTop: "1rem" }}>{cat?.description || k.intro}</p>
          <CategoryNav kind={kind} active={categoria} />
          {!isLoading && !posts.length && <p className="m-note" style={{ marginTop: "2rem" }}>Nenhuma publicação por aqui ainda.</p>}
          {first && <div style={{ marginTop: "2rem" }}><PostCard p={first} big /></div>}
          {rest.length > 0 && <div className="m-grid m-g3" style={{ marginTop: "2rem" }}>{rest.map((p) => <PostCard key={p.id} p={p} />)}</div>}
        </section>
        {blog.length > 0 && (
          <section className="m-sec">
            <div className="m-kick">Blog</div>
            <h2>Do blog da MON</h2>
            <div className="m-grid m-g3" style={{ marginTop: "1.8rem" }}>{blog.map((p) => <PostCard key={p.id} p={p} />)}</div>
            <div className="m-ctas"><a href="/blog" className="m-btn ghost">Ver o blog</a></div>
          </section>
        )}
      </div>
    </MonPage>
  );
}

export function PostArticle({ kind, slug }: { kind: PostKind; slug: string }) {
  const k = KINDS[kind];
  const { data: p } = useQuery(postQuery(kind, slug));
  const { data: more = [] } = useQuery(postsQuery(kind, { limit: 4 }));
  if (!p) return null;
  const related = more.filter((x) => x.id !== p.id).slice(0, 3);
  return (
    <MonPage>
      <div className="m-wrap">
        <article className="m-post">
          <nav className="m-crumbs" aria-label="Você está em">
            <Link to="/">Início</Link> / <a href={k.base}>{k.plural}</a>
            {p.category && <> / <a href={`${k.base}/categoria/${p.category.slug}`}>{p.category.name}</a></>}
          </nav>
          <header>
            <div className="m-kick">{p.category?.name ?? k.label}</div>
            <h1>{p.title}</h1>
            {p.excerpt && <p className="m-lead">{p.excerpt}</p>}
            <div className="m-mono meta">
              {p.published_at && <time dateTime={p.published_at}>{formatDate(p.published_at)}</time>}
              {p.author && <span>Por {p.author}</span>}
              <span>{readingMinutes(p.content)} min de leitura</span>
            </div>
          </header>
          {p.cover_url && (
            <figure className="cover"><img src={p.cover_url} alt={p.cover_alt ?? ""} fetchPriority="high" /></figure>
          )}
          <PostBody text={p.content} />
          <PostGallery items={p.gallery ?? []} />
          {p.tags.filter((t) => t !== "exemplo").length > 0 && (
            <ul className="m-post-tags" aria-label="Assuntos">{p.tags.filter((t) => t !== "exemplo").map((t) => <li key={t}>{t}</li>)}</ul>
          )}
        </article>
        {related.length > 0 && (
          <section className="m-sec">
            <div className="m-kick">Continue lendo</div>
            <h2>Mais {kind === "noticia" ? "notícias" : "do blog"}</h2>
            <div className="m-grid m-g3" style={{ marginTop: "1.8rem" }}>{related.map((x) => <PostCard key={x.id} p={x} />)}</div>
          </section>
        )}
        <section className="m-sec">
          <div className="m-band"><div className="inner">
            <div><div className="m-kick">Cursos MON</div><h2>Do texto para a bancada</h2><p style={{ marginTop: ".8rem" }}>Matérias-primas na sua casa e aulas com perfumistas.</p></div>
            <div><Link to="/cursos" className="m-btn">Ver os cursos</Link></div>
          </div></div>
        </section>
      </div>
    </MonPage>
  );
}
