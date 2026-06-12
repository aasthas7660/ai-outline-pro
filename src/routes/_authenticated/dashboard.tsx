import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Sparkles, Star, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — OutlineCraft AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [total, favs, recent] = await Promise.all([
        supabase.from("outlines").select("id", { count: "exact", head: true }),
        supabase.from("favorites").select("id", { count: "exact", head: true }),
        supabase.from("outlines").select("id, topic, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        total: total.count ?? 0,
        favorites: favs.count ?? 0,
        recent: recent.data ?? [],
      };
    },
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your AI outline workspace at a glance.</p>
        </div>
        <Button asChild>
          <Link to="/new"><Sparkles className="mr-2 h-4 w-4" />New outline</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total generations" value={stats.data?.total} icon={FileText} loading={stats.isLoading} />
        <StatCard title="Favorites" value={stats.data?.favorites} icon={Star} loading={stats.isLoading} />
        <StatCard title="This week" value={stats.data?.recent.length} icon={Sparkles} loading={stats.isLoading} />
      </div>

      <Card className="surface-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent outlines</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link to="/history">View all <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
        </CardHeader>
        <CardContent>
          {stats.isLoading ? (
            <div className="space-y-2">{[0,1,2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : stats.data?.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No outlines yet. Generate your first one!</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.data?.recent.map((o) => (
                <li key={o.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.topic}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm"><Link to="/history">Open</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string; value?: number; icon: React.ComponentType<{ className?: string }>; loading: boolean }) {
  return (
    <Card className="surface-card">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 font-display text-3xl font-semibold">{value ?? 0}</p>}
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-md bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
