import { supabase } from "@/integrations/supabase/client";

export async function snapshotPage(pageId: string, label?: string) {
  const { data: page, error: pe } = await supabase
    .from("pages").select("title,seo_title,seo_description").eq("id", pageId).single();
  if (pe || !page) throw pe ?? new Error("Página não encontrada");
  const { data: blocks } = await supabase
    .from("page_blocks").select("type,position,content").eq("page_id", pageId).order("position");
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("page_versions").insert({
    page_id: pageId,
    label: label ?? null,
    title: page.title,
    seo_title: page.seo_title,
    seo_description: page.seo_description,
    blocks_snapshot: (blocks ?? []) as never,
    created_by: u.user?.id ?? null,
  });
  if (error) throw error;
}

export async function publishPage(pageId: string) {
  await snapshotPage(pageId, "Publicação");
  const { error } = await supabase.from("pages").update({ status: "published" }).eq("id", pageId);
  if (error) throw error;
}

export async function unpublishPage(pageId: string) {
  const { error } = await supabase.from("pages").update({ status: "draft" }).eq("id", pageId);
  if (error) throw error;
}

type SnapshotBlock = { type: string; position: number; content: Record<string, unknown> };

export async function restoreVersion(versionId: string) {
  const { data: v, error } = await supabase
    .from("page_versions").select("*").eq("id", versionId).single();
  if (error || !v) throw error ?? new Error("Versão não encontrada");
  // snapshot current as safety
  await snapshotPage(v.page_id, "Auto · antes de restaurar");
  await supabase.from("pages").update({
    title: v.title, seo_title: v.seo_title, seo_description: v.seo_description,
  }).eq("id", v.page_id);
  await supabase.from("page_blocks").delete().eq("page_id", v.page_id);
  const snap = (v.blocks_snapshot as unknown as SnapshotBlock[]) ?? [];
  if (snap.length) {
    await supabase.from("page_blocks").insert(
      snap.map((b) => ({ page_id: v.page_id, type: b.type, position: b.position, content: b.content as never })),
    );
  }
}
