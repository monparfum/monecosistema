import { Link } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  brand?: string | null;
  price_cents: number;
  image_url?: string | null;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link to="/produto/$slug" params={{ slug: p.slug }} className="group block">
      <div className="aspect-[4/5] bg-muted overflow-hidden">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">
            sem imagem
          </div>
        )}
      </div>
      <div className="pt-4 space-y-1">
        {p.brand && <div className="eyebrow">{p.brand}</div>}
        <div className="font-display text-lg leading-tight">{p.name}</div>
        <div className="text-sm">{formatBRL(p.price_cents)}</div>
      </div>
    </Link>
  );
}
