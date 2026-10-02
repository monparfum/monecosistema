import { Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitLead } from "@/lib/leads.functions";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";
import { lines, useSite, waLink } from "@/lib/site-content";

// ---------- Catálogo (produtos do painel + conteúdo editorial em products.details) ----------

export type Details = {
  kind?: "curso" | "kit"; estagio?: string; formato?: string; nota?: string; badge?: string; destaque?: boolean; turma?: string;
  dor?: string; sub?: string; aprende?: string; prereq?: string; naoE?: string;
  grupo?: "criacao" | "treino" | "limitada"; cor?: "bois" | "jardin" | "magnetic" | "heritage"; titulo?: string; resumo?: string; desc?: string;
  topo?: string; coracao?: string; fundo?: string;
};

export type ShopProduct = {
  id: string; slug: string; name: string; brand: string | null; description: string | null; notes: string | null;
  price_cents: number; compare_at_cents: number | null; stock: number; active: boolean; coming_soon: boolean;
  image_url: string | null; delivery_type: "physical" | "digital" | "hybrid"; details: Details; created_at: string;
};

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("products")
      .select("id, slug, name, brand, description, notes, price_cents, compare_at_cents, stock, active, coming_soon, image_url, delivery_type, details, created_at")
      .eq("active", true).order("created_at");
    if (error) throw error;
    return (data ?? []) as unknown as ShopProduct[];
  },
});

export function useCatalog() {
  const { data = [], isLoading } = useQuery(catalogQuery);
  return {
    isLoading,
    all: data,
    bySlug: (slug: string) => data.find((p) => p.slug === slug),
    cursos: data.filter((p) => p.details?.kind === "curso"),
    kits: (grupo?: Details["grupo"]) => data.filter((p) => p.details?.kind === "kit" && (!grupo || p.details.grupo === grupo)),
    outros: data.filter((p) => !p.details?.kind),
  };
}

export const ESTAGIOS = ["Iniciante", "Intermediário", "Avançado"] as const;
export const kitName = (p: ShopProduct) => p.details?.titulo || p.name;

export const isBuyable = (p?: ShopProduct) =>
  !!p && p.active && !p.coming_soon && p.price_cents > 0 && (p.delivery_type === "digital" || p.stock > 0);

export function Price({ p }: { p?: ShopProduct }) {
  if (!p || p.coming_soon || p.price_cents <= 0) return <>Em breve</>;
  return (
    <>
      {p.compare_at_cents && p.compare_at_cents > p.price_cents && <s>{formatBRL(p.compare_at_cents)}</s>} {formatBRL(p.price_cents)}
    </>
  );
}

// Compra: sacola → checkout. Indisponível/em breve → conversa no WhatsApp.
export function BuyButton({ p, label, className = "m-btn" }: { p?: ShopProduct; label: string; className?: string }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const geral = useSite("geral");
  if (!isBuyable(p)) {
    const soldOut = p && !p.coming_soon && p.price_cents > 0 && p.delivery_type !== "digital" && p.stock <= 0;
    return (
      <a className={`${className} ghost`} href={waLink(geral.text("whatsapp_numero"), `Olá! Tenho interesse em ${p?.name ?? "um produto da MON"}.`)} target="_blank" rel="noopener noreferrer">
        {soldOut ? "Esgotado — avise-me" : "Quero saber quando abrir"}
      </a>
    );
  }
  return (
    <button
      className={className}
      onClick={() => {
        add({ productId: p!.id, slug: p!.slug, name: p!.name, brand: p!.brand, priceCents: p!.price_cents, imageUrl: p!.image_url }, 1);
        toast.success("Adicionado à sacola");
        navigate({ to: "/carrinho" });
      }}
    >
      {label}
    </button>
  );
}

export function FaqList({ items }: { items: Record<string, string>[] }) {
  return (
    <div className="m-faq">
      {items.filter((i) => i.pergunta?.trim()).map((i) => (
        <details key={i.pergunta}>
          <summary>{i.pergunta}</summary>
          <p>{i.resposta}</p>
        </details>
      ))}
    </div>
  );
}

export type Art = "vanille" | "lavande" | "bois" | "kit" | "jasmin" | "ambre";

// Ilustração que combina com o nome do produto/curso (enquanto não houver foto)
export function artFor(text: string, fallback: Art = "kit"): Art {
  const t = text.toLowerCase();
  if (/baunilha|gourmand|vanil/.test(t)) return "vanille";
  if (/jasmim|n[eé]roli|flor|jardin/.test(t)) return "jasmin";
  if (/madeira|bois|vetiver/.test(t)) return "bois";
  if (/lavanda|dilui|erva|banana/.test(t)) return "lavande";
  if (/heritage|magn|[aâ]mbar|resina|legais/.test(t)) return "ambre";
  return fallback;
}

// Foto enviada pelo Estúdio; sem foto, mostra a ilustração (art) ou o monograma (initials)
export function Ph({ style, image, alt = "", art, initials }: { style?: React.CSSProperties; image?: string | null; alt?: string; art?: Art; initials?: string }) {
  if (!image && initials) return <div className="m-ph mono" aria-hidden="true" style={style}><span>{initials}</span></div>;
  const src = image || (art ? `/img/mon-${art}.svg` : null);
  return (
    <div className={`m-ph${!image && art ? " art" : ""}`} role={image ? "img" : undefined} aria-label={image ? alt : undefined} aria-hidden={image ? undefined : true}
      style={{ ...style, ...(src ? { backgroundImage: `url(${src})` } : {}) }} />
  );
}

export function CourseCard({ p }: { p: ShopProduct }) {
  const d = p.details;
  return (
    <Link to="/cursos/$slug" params={{ slug: p.slug }} className="m-course">
      <div className="top">
        {d.badge ? <span className={`m-tag ${d.badge === "Mais procurado" ? "hot" : ""}`}>{d.badge}</span> : <span />}
        {d.nota && <span className="m-score">{d.nota}</span>}
      </div>
      <h3>{p.name}</h3>
      <div className="meta">{[d.formato, d.estagio].filter(Boolean).join(" · ")}</div>
      <div className="res">{p.description}</div>
      <div className="price">
        <Price p={p} />
        <div className="m-small" style={{ marginTop: ".3rem", fontFamily: "var(--m-sans)" }}>{d.turma ? `Próxima turma: ${d.turma} · ` : ""}Kit incluso</div>
      </div>
    </Link>
  );
}

export function KitCard({ p, cta = "Conhecer o kit", showPrice = false }: { p: ShopProduct; cta?: string; showPrice?: boolean }) {
  const d = p.details;
  return (
    <div className="m-terr">
      <div className={`field f-${d.cor ?? "bois"}`} style={p.image_url ? { backgroundImage: `linear-gradient(transparent 40%, rgba(0,0,0,.45)), url(${p.image_url})` } : undefined}>
        <span>{kitName(p)}</span>
      </div>
      <div className="body">
        <p>{d.resumo || p.description}</p>
        {showPrice && <div className="kprice"><Price p={p} /></div>}
        {d.grupo === "limitada" && <div className="m-limited">Edição limitada</div>}
        <Link to="/produtos/$slug" params={{ slug: p.slug }} className="m-btn sm" style={{ marginTop: d.grupo === "limitada" ? ".8rem" : 0 }}>{cta}</Link>
      </div>
    </div>
  );
}

// ---------- Formulários (vão para o CRM via servidor: valida, limita e avisa a equipe) ----------

export function useLeadForm(kind: "quiz" | "atelier" | "corporativo" | "contato" | "newsletter") {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>, extra: Record<string, unknown> = {}) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return true; // armadilha para robôs
    const take = (k: string) => String(fd.get(k) ?? "").trim();
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => { if (!["name", "email", "phone", "website"].includes(k) && typeof v === "string" && v.trim()) payload[k] = v.trim().slice(0, 2000); });
    setSending(true);
    const error = await submitLead({ data: { kind, name: take("name"), email: take("email"), phone: take("phone"), payload: { ...payload, ...extra } } })
      .then(() => null, (e: Error) => e);
    setSending(false);
    if (error) {
      toast.error(/Muitos envios|E-mail inválido/.test(error.message) ? error.message : "Não foi possível enviar. Confira o e-mail ou fale pelo WhatsApp.");
      return false;
    }
    setSent(true);
    return true;
  };
  return { submit, sending, sent };
}

export const Honeypot = () => (
  <div className="m-hp" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
);

export function WhatsAppFloat() {
  const geral = useSite("geral");
  return (
    <a className="m-wa" href={waLink(geral.text("whatsapp_numero"))} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
    </a>
  );
}

// Bloco de contato (endereço, CNPJ, WhatsApp, e-mail, horários) — usado em Contato e Sobre
export function ContactBlock({ withHours = true }: { withHours?: boolean }) {
  const g = useSite("geral");
  return (
    <>
      <p><b>{g.text("empresa")}</b><br />{g.text("endereco")}<br />{g.text("cidade")}<br />CNPJ: {g.text("cnpj")}</p>
      <p>
        <b>WhatsApp:</b> <a href={waLink(g.text("whatsapp_numero"))} target="_blank" rel="noopener noreferrer">{g.text("whatsapp")}</a>
        {g.text("email") && <><br /><b>E-mail:</b> <a href={`mailto:${g.text("email")}`}>{g.text("email")}</a></>}
      </p>
      {withHours && <p><b>Horário de atendimento</b><br />{lines(g.text("horarios")).map((h) => <span key={h}>{h}<br /></span>)}</p>}
    </>
  );
}
