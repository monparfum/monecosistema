import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { listCourses, membersEnabled, syncProduct } from "@/lib/members.server";

const UUID = /^[0-9a-f-]{36}$/i;

async function assertAdmin(supabase: Pick<typeof supabaseAdmin, "rpc">, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores");
}

// Cursos da área de membros para o seletor do cadastro de produto
export const listMemberCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!membersEnabled()) return { configured: false, courses: [] };
    return { configured: true, courses: await listCourses() };
  });

// Envia o produto (com os cursos vinculados) para a área de membros. Lê do banco: o cliente só informa o id.
export const syncMemberProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string }) => {
    if (!UUID.test(d.productId)) throw new Error("productId inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!membersEnabled()) return { synced: false };
    const { data: p } = await supabaseAdmin.from("products").select("id, name, active, delivery_type, member_course_ids").eq("id", data.productId).maybeSingle();
    if (!p) throw new Error("Produto não encontrado");
    // Virou físico: desativa lá para não liberar curso por engano
    await syncProduct({ id: p.id, name: p.name, active: p.active && p.delivery_type !== "physical", courseIds: p.delivery_type === "physical" ? [] : p.member_course_ids });
    return { synced: true };
  });
