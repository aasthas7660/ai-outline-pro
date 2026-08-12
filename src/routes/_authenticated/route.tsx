import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-3 border-b border-border px-4 sticky top-0 bg-background/80 backdrop-blur z-30">
            <SidebarTrigger />
            <div className="font-display text-sm font-semibold tracking-tight">OutlineCraft</div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <div className="min-h-full rounded-[28px] bg-card border border-border p-6 md:p-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>

  );
}
