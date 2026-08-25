import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Moon, Sun } from "lucide-react";
import { usePreferences, LANGUAGE_OPTIONS, type AppLanguage } from "@/lib/preferences";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HistoryPanel } from "@/components/HistoryPanel";

export const Route = createFileRoute("/_authenticated/settings")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search.tab === "history" ? ("history" as const) : ("general" as const),
  }),
  head: () => ({ meta: [{ title: "Settings — OutlineCraft AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { theme, setTheme, language, setLanguage } = usePreferences();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s_ } = await supabase.auth.getSession();
    const u = { user: s_.session?.user ?? null };
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data } = await supabase.from("profiles").select("display_name").eq("id", u.user.id).maybeSingle();
      setDisplayName(data?.display_name ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: s_ } = await supabase.auth.getSession();
    const u = { user: s_.session?.user ?? null };
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").upsert({ id: u.user.id, display_name: displayName.trim() || null });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, theme, language and outline history.</p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => navigate({ to: ".", search: { tab: v === "history" ? "history" : "general" } })}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 max-w-2xl">

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Switch between dark and light themes.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" /> Dark
          </Button>
          <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" /> Light
          </Button>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Interface language</CardTitle>
          <CardDescription>Choose the language for the app interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(v) => setLanguage(v as AppLanguage)}>
            <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This information is visible only to you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
              </div>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="history">
          <HistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
