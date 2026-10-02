import { createFileRoute } from "@tanstack/react-router";
import { EntriesPage } from "@/components/finance/entries";

export const Route = createFileRoute("/_financeiro/financeiro/a-receber")({
  head: () => ({ meta: [{ title: "A receber — Financeiro" }] }),
  component: () => <EntriesPage key="receber" preset="receber" />,
});
