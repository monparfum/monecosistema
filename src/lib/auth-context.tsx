import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type StudioRole = "admin" | "editor" | "reviewer" | "customer";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  roles: StudioRole[];
  isAdmin: boolean;
  isEditor: boolean;
  isReviewer: boolean;
  canPublish: boolean;
  hasStudioAccess: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  roles: [],
  isAdmin: false,
  isEditor: false,
  isReviewer: false,
  canPublish: false,
  hasStudioAccess: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<StudioRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as StudioRole));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) setTimeout(() => loadRoles(s.user.id), 0);
      else setRoles([]);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) loadRoles(data.session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin = roles.includes("admin");
  const isEditor = roles.includes("editor");
  const isReviewer = roles.includes("reviewer");
  const canPublish = isAdmin || isReviewer;
  const hasStudioAccess = isAdmin || isEditor || isReviewer;

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        isAdmin,
        isEditor,
        isReviewer,
        canPublish,
        hasStudioAccess,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
