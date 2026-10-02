import { createFileRoute } from "@tanstack/react-router";
import { EntriesPage } from "@/components/finance/entries";

export const Route = createFileRoute("/_financeiro/financeiro/lancamentos")({
  head: () => ({ meta: [{ title: "Lançamentos — Financeiro" }] }),
  component: () => <EntriesPage preset="todos" />,
});
