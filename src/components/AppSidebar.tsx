import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Package,
  CheckSquare,
  MessageCircle,
  BarChart3,
  Settings,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pipeline", url: "/pipeline", icon: TrendingUp },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Tarefas", url: "/tasks", icon: CheckSquare },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageCircle },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={cn("border-none bg-background py-4", collapsed ? "w-20" : "w-64")} collapsible="icon">
      <SidebarContent className="bg-background">
        <div className={cn("mb-6 px-6", collapsed && "px-4")}>
          {!collapsed ? (
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-black tracking-tighter text-foreground italic">bolten</span>
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center italic font-black text-white text-xl">
              b
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12 rounded-full">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) => cn(
                        "flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-300",
                        "text-base font-medium",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-none"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-accent" : "text-sidebar-foreground")}
                          />
                          {!collapsed && (
                            <span className="truncate">
                              {item.title}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}