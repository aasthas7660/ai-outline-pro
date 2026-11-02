import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — OutlineCraft AI" },
      { name: "description", content: "Completing your secure sign-in to OutlineCraft AI." },
      { property: "og:title", content: "Signing you in — OutlineCraft AI" },
      { property: "og:description", content: "Completing your secure sign-in to OutlineCraft AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign in…");

  useEffect(() => {
    let done = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const go = () => {
      if (done) return;
      done = true;
      if (timer) clearInterval(timer);
      navigate({ to: "/dashboard", replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });

    // Poll briefly: covers implicit/hash flows and late session persistence.
    let tries = 0;
    const startPolling = () => {
      timer = setInterval(async () => {
        tries += 1;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          go();
        } else if (tries > 20) {
          if (timer) clearInterval(timer);
          setMessage("Could not complete sign in. Redirecting…");
          if (!done) {
            done = true;
            navigate({ to: "/auth", replace: true });
          }
        }
      }, 250);
    };

    (async () => {
      // PKCE flow: Supabase redirects back with ?code=... — exchange it for a session.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
          // onAuthStateChange fires with the new session and navigates.
          window.history.replaceState({}, "", window.location.pathname);
          return;
        } catch {
          // Already exchanged or invalid — fall back to session polling.
        }
      }
      startPolling();
    })();

    return () => {
      if (timer) clearInterval(timer);
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
