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
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/dashboard", replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) go();
    });

    // Poll briefly: the OAuth helper may still be persisting the session.
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        clearInterval(timer);
        go();
      } else if (tries > 20) {
        clearInterval(timer);
        setMessage("Could not complete sign in. Redirecting…");
        if (!done) {
          done = true;
          navigate({ to: "/auth", replace: true });
        }
      }
    }, 250);

    return () => {
      clearInterval(timer);
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
