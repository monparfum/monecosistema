import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Página pública no layout da cópia MON
export function MonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mon m-page">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
