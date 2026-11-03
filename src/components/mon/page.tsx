import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// Página pública no layout da cópia MON
export function MonPage({ children, overlay = false }: { children: React.ReactNode; overlay?: boolean }) {
  useReveal();
  return (
    <div className="mon m-page">
      <SiteHeader overlay={overlay} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

// Entrada suave dos blocos .m-reveal ao rolar. O que já está na tela aparece na hora (sem piscar).
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".m-reveal:not(.in)"));
    if (!els.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vh = window.innerHeight;
    const pending: HTMLElement[] = [];
    for (const el of els) {
      if (reduce || el.getBoundingClientRect().top < vh * 0.92) el.classList.add("in");
      else pending.push(el);
    }
    document.documentElement.classList.add("js");
    if (!pending.length) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    pending.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
