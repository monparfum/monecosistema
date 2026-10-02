import { queryOptions, useQuery, type QueryClient } from "@tanstack/react-query";
import { Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import { defaultsOf, type ListItem, type PageValues } from "@/lib/site-schema";

// Conteúdo de uma página = padrões do código + o que foi editado no painel (site_content)
export const siteQuery = (page: string) =>
  queryOptions({
    queryKey: ["site-content", page],
    staleTime: 60_000,
    queryFn: async (): Promise<PageValues> => {
      const { data } = await supabase.from("site_content").select("data").eq("page", page).maybeSingle();
      const saved = (data?.data ?? {}) as PageValues;
      const merged = defaultsOf(page);
      for (const [k, v] of Object.entries(saved)) if (k in merged) merged[k] = v;
      return merged;
    },
  });

// Para usar no loader da rota: conteúdo já vem pronto na renderização do servidor (sem "piscar")
export const loadSite = (qc: QueryClient, ...pages: string[]) =>
  Promise.all(["geral", ...pages].map((p) => qc.ensureQueryData(siteQuery(p)).catch(() => null)));

export function useSite(page: string) {
  const { data } = useQuery({ ...siteQuery(page), placeholderData: defaultsOf(page) });
  const values = data ?? defaultsOf(page);
  return {
    text: (key: string) => (typeof values[key] === "string" ? (values[key] as string) : ""),
    list: (key: string) => (Array.isArray(values[key]) ? (values[key] as ListItem[]) : []),
  };
}

// **negrito** dentro de uma linha (sem HTML: texto vindo do painel nunca vira código)
export function Inline({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))}</>;
}

// Parágrafos separados por linha em branco; quebra simples vira <br>; "## " vira subtítulo
export function Rich({ text, style }: { text: string; style?: React.CSSProperties }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h3 key={i} style={{ marginTop: "1.6rem", ...style }}>{b.slice(3)}</h3>
        ) : (
          <p key={i} style={i === 0 ? style : undefined}>
            {b.split("\n").map((line, j) => <Fragment key={j}>{j > 0 && <br />}<Inline text={line} /></Fragment>)}
          </p>
        ),
      )}
    </>
  );
}

// Linhas de um campo de texto (ex.: horários)
export const lines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export const waLink = (numero: string, msg = "Olá! Vim pelo site da MON e preciso de atendimento.") =>
  `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
