import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/module-shell";
import { StatCard, StatGrid } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";

export const Route = createFileRoute("/_academy/academy/")({
  head: () => ({ meta: [{ title: "Academy — Mon Parfum" }] }),
  component: AcademyIndex,
});

function AcademyIndex() {
  const { data } = useQuery({
    queryKey: ["academy-overview"],
    queryFn: async () => {
      const [courses, enrollments] = await Promise.all([
        supabase.from("products").select("id, categories!inner(slug)", { count: "exact", head: false }).eq("active", true).eq("categories.slug", "cursos"),
        supabase.from("enrollments").select("user_id, product_id"),
      ]);
      const uniqueStudents = new Set((enrollments.data ?? []).map((e) => e.user_id)).size;
      return {
        courses: courses.data?.length ?? 0,
        students: uniqueStudents,
        enrollments: enrollments.data?.length ?? 0,
      };
    },
  });

  const empty = !data || data.courses === 0;

  return (
    <div className="space-y-10 max-w-[1200px]">
      <PageHeader
        eyebrow="Módulo · Academy"
        title="Área de membros"
        description="Cada curso comprado no Commerce libera acesso automaticamente."
      />
      <StatGrid>
        <StatCard label="Cursos ativos" value={data?.courses ?? "—"} />
        <StatCard label="Alunos" value={data?.students ?? "—"} />
        <StatCard label="Matrículas" value={data?.enrollments ?? "—"} />
        <StatCard label="Certificados" value="—" hint="Em breve" />
      </StatGrid>
      {empty && (
        <EmptyState
          eyebrow="Comece por aqui"
          title="Publique o primeiro curso."
          description='Crie um produto na categoria "cursos" no Commerce. Toda compra paga vira matrícula automática.'
        />
      )}
    </div>
  );
}
