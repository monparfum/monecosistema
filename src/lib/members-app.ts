// Área de membros própria (app separado, outro Supabase). Aluno entra pela raiz; admin em /app.
export const MEMBERS_APP_URL = ((import.meta.env.VITE_MEMBERS_APP_URL as string | undefined) ?? "").replace(/\/$/, "") || null;
