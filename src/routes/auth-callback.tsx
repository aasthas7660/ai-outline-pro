import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth-callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — OutlineCraft AI" },
      {
        name: "description",
        content: "Completing your secure sign-in to OutlineCraft AI.",
      },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing sign in…");

  useEffect(() => {
    let active = true;

    const finishSignIn = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (!data.session) {
          throw new Error(
            "No active session was found. Please try signing in again."
          );
        }

        if (!active) return;

        window.history.replaceState(
          {},
          document.title,
          "/auth-callback"
        );

        navigate({ to: "/dashboard", replace: true });
      } catch (err) {
        if (!active) return;

        setMessage(
          err instanceof Error
            ? `${err.message} Redirecting to sign in…`
            : "Could not complete sign in. Redirecting…"
        );

        window.setTimeout(() => {
          if (active) {
            navigate({ to: "/auth", replace: true });
          }
        }, 2500);
      }
    };

    void finishSignIn();

    return () => {
      active = false;
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