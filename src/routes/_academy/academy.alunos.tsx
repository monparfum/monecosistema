import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRow } from "@/components/skeleton-row";

export const Route = createFileRoute("/_academy/academy/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Academy" }] }),
  component: AcademyAlunos,
});

function AcademyAlunos() {
  const { data, isLoading } = useQuery({
    queryKey: ["academy-enrollments"],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("id, status, created_at, user_id, product_id, products(name, brand)")
        .order("created_at", { ascending: false });
      if (!enrollments?.length) return [];
      const userIds = [...new Set(enrollments.map((e) => e.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
      return enrollments.map((e) => ({ ...e, student_name: nameById.get(e.user_id) ?? "Aluno" }));
    },
  });

  return (
    <div className="space-y-8 max-w-[1200px]">
      <PageHeader eyebrow="Academy" title="Alunos" description="Cada compra de curso libera automaticamente um aluno." />
      {isLoading ? (
        <div className="border-y border-border divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)}
        </div>
      ) : !data?.length ? (
        <EmptyState eyebrow="Sem matrículas" title="Nenhum aluno matriculado ainda." description="Assim que um pedido de curso for pago, o aluno aparece aqui automaticamente." />
      ) : (
        <div className="border-y border-border divide-y divide-border">
          {data.map((e) => (
            <div key={e.id} className="py-5 grid grid-cols-[1.4fr_1fr_auto] gap-6 items-center">
              <div>
                <div className="eyebrow">{new Date(e.created_at).toLocaleDateString("pt-BR")}</div>
                <div className="font-display text-xl">{e.student_name}</div>
              </div>
              <div className="text-sm">
                <div className="eyebrow">{e.products?.brand}</div>
                <div className="italic font-display">{e.products?.name}</div>
              </div>
              <div className="eyebrow">{e.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
