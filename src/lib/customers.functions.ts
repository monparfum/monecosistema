import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Clientes da loja (B2C). E-mail e último acesso vêm do cadastro de login (auth), que só o servidor lê.
async function assertAdmin(supabase: Pick<typeof supabaseAdmin, "rpc">, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Apenas administradores");
}

const PAID = ["paid", "processing", "shipped", "delivered"];

export type CustomerRow = {
  id: string; email: string; name: string | null; phone: string | null; createdAt: string; lastSignIn: string | null;
  orders: number; paidOrders: number; spentCents: number; lastOrderAt: string | null; pending: number;
};

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const users: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null }[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(error.message);
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const [{ data: profiles }, { data: orders }, { data: staff }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone"),
      supabaseAdmin.from("orders").select("user_id, status, total_cents, created_at, shipping_phone").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id").in("role", ["admin", "editor", "reviewer"]),
    ]);
    const staffIds = new Set((staff ?? []).map((r) => r.user_id));
    const prof = new Map((profiles ?? []).map((p) => [p.id, p]));
    return users.filter((u) => !staffIds.has(u.id)).map((u) => {
      const own = (orders ?? []).filter((o) => o.user_id === u.id);
      const paid = own.filter((o) => PAID.includes(o.status));
      return {
        id: u.id, email: u.email ?? "", name: prof.get(u.id)?.full_name ?? null,
        phone: prof.get(u.id)?.phone ?? own.find((o) => o.shipping_phone)?.shipping_phone ?? null,
        createdAt: u.created_at, lastSignIn: u.last_sign_in_at ?? null,
        orders: own.length, paidOrders: paid.length, spentCents: paid.reduce((s, o) => s + o.total_cents, 0),
        lastOrderAt: own[0]?.created_at ?? null, pending: own.filter((o) => o.status === "pending_payment").length,
      };
    });
  });

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.id)) throw new Error("id inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: u, error } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (error || !u.user) throw new Error("Cliente não encontrado");
    const [{ data: profile }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, phone").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("orders")
        .select("id, order_number, status, total_cents, discount_cents, coupon_code, created_at, payment_method, requires_shipping, shipping_recipient, shipping_line1, shipping_number, shipping_district, shipping_city, shipping_state, shipping_postal_code, shipping_phone, shipping_document, order_items(product_name, quantity, line_total_cents)")
        .eq("user_id", data.id).order("created_at", { ascending: false }),
    ]);
    return {
      id: u.user.id, email: u.user.email ?? "", createdAt: u.user.created_at, lastSignIn: u.user.last_sign_in_at ?? null,
      name: profile?.full_name ?? null, phone: profile?.phone ?? null, orders: orders ?? [],
    };
  });
