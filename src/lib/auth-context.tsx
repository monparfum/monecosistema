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

  const loadRoles = async (uid: string): Promise<StudioRole[]> => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (error) {
      console.error(error);
      return [];
    }
    return (data ?? []).map((r) => r.role as StudioRole);
  };

  useEffect(() => {
    let alive = true;
    let run = 0;

    const applySession = async (nextSession: Session | null) => {
      const current = ++run;
      setSession(nextSession);

      if (!nextSession?.user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const nextRoles = await loadRoles(nextSession.user.id);
      if (!alive || current !== run) return;
      setRoles(nextRoles);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s?.user) {
        setRoles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setTimeout(() => { void applySession(s); }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
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
