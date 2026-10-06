import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow mb-4">404</div>
        <h1 className="font-display text-4xl">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi removido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-block border-b border-foreground pb-1 text-sm hover:opacity-70"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const errorMessage = error instanceof Error ? error.message : String(error ?? "Erro inesperado");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Algo deu errado</h1>
        <p className="mt-3 text-sm text-muted-foreground">{errorMessage}</p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="border-b border-foreground pb-1 text-sm"
          >
            Tentar novamente
          </button>
          <a href="/" className="border-b border-border pb-1 text-sm text-muted-foreground">
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MON PARFUM — Experiência Olfativa" },
      { name: "description", content: "Formação em perfumaria autoral: cursos com kit de matérias-primas em casa, experiências de criação e workshops corporativos." },
      { property: "og:title", content: "MON PARFUM — Experiência Olfativa" },
      { property: "og:description", content: "Formação em perfumaria autoral: cursos com kit de matérias-primas em casa, experiências de criação e workshops corporativos." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "MON PARFUM — Experiência Olfativa" },
      { name: "twitter:description", content: "Formação em perfumaria autoral: cursos com kit de matérias-primas em casa, experiências de criação e workshops corporativos." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/711ceb71-5070-4b0a-aedd-ca5070a0797a/id-preview-06aff9fd--6428e65e-d62c-4175-919a-418931db6464.lovable.app-1780695393306.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/711ceb71-5070-4b0a-aedd-ca5070a0797a/id-preview-06aff9fd--6428e65e-d62c-4175-919a-418931db6464.lovable.app-1780695393306.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Recarrega rotas/dados só quando muda QUEM está logado (não a cada renovação de token ou troca de aba)
    let uid: string | null | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user?.id ?? null;
      if (uid === undefined) { uid = next; return; }
      if (next === uid) return;
      uid = next;
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
