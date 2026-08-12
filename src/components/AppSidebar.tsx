import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Sparkles, History, Star, Settings, LogOut, Search, Wand2,
  Users, Code2, CalendarDays, Link as LinkIcon, Download,
  Image as ImageIcon, GitCompareArrows, ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/lib/preferences";

const items = [
  { key: "nav.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "nav.new", url: "/new", icon: Sparkles },
  { key: "nav.brief", url: "/content-brief", icon: ClipboardList },
  { key: "nav.seo", url: "/seo-tools", icon: Search },
  { key: "nav.content", url: "/content-tools", icon: Wand2 },
  { key: "nav.images", url: "/image-suggestions", icon: ImageIcon },
  
  { key: "nav.gap", url: "/content-gap", icon: GitCompareArrows },
  { key: "nav.competitor", url: "/competitor-analysis", icon: Users },
  { key: "nav.schema", url: "/schema-generator", icon: Code2 },
  { key: "nav.calendar", url: "/content-calendar", icon: CalendarDays },
  { key: "nav.links", url: "/internal-links", icon: LinkIcon },
  { key: "nav.export", url: "/export-center", icon: Download },
  { key: "nav.history", url: "/history", icon: History },
  { key: "nav.favorites", url: "/favorites", icon: Star },
  { key: "nav.settings", url: "/settings", icon: Settings },
] as const;


export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const t = useT();

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-secondary">
            <LottieIcon name="sparkle" className="h-6 w-6" />
          </div>
          <span className="font-display text-lg font-semibold">OutlineCraft</span>
        </Link>

      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.workspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={path === item.url}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          {t("nav.signout")}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
