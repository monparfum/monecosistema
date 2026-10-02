import { createFileRoute } from "@tanstack/react-router";
import { EntriesPage } from "@/components/finance/entries";

export const Route = createFileRoute("/_financeiro/financeiro/a-pagar")({
  head: () => ({ meta: [{ title: "A pagar — Financeiro" }] }),
  component: () => <EntriesPage key="pagar" preset="pagar" />,
});
