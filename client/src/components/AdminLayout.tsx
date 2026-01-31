import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Key, Shield, Settings, Home, ShoppingCart } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { Badge } from "./ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background cyber-grid">
        <div className="relative flex flex-col items-center gap-8 p-8 max-w-md w-full border border-border/50 rounded-lg bg-card/50">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-secondary" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-secondary" />
          
          <div className="absolute top-4 right-4">
            <LanguageSwitcher variant="icon" />
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <div className="font-display text-2xl font-bold">
              <span className="neon-text-pink">KSA</span>
              <span className="text-muted-foreground">,</span>
              <span className="neon-text-cyan">Boom</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-center">
              {t('auth.adminAccessRequired')}
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {t('auth.adminAccessDesc')}
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full font-display font-bold tracking-wider bg-primary hover:bg-primary/90 neon-glow-pink"
          >
            {t('auth.signIn')}
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background cyber-grid">
        <div className="relative flex flex-col items-center gap-8 p-8 max-w-md w-full border border-destructive/50 rounded-lg bg-card/50">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-destructive" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-destructive" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-destructive" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-destructive" />
          
          <div className="absolute top-4 right-4">
            <LanguageSwitcher variant="icon" />
          </div>
          
          <Shield className="w-16 h-16 text-destructive" />
          <h1 className="font-display text-2xl font-bold text-destructive">
            {t('auth.accessDenied')}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.noPermission')}
          </p>
          <Link href="/">
            <Button variant="outline" className="font-display">
              <Home className="w-4 h-4 mr-2" />
              {t('auth.returnHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <AdminLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </AdminLayoutContent>
    </SidebarProvider>
  );
}

type AdminLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function AdminLayoutContent({
  children,
  setSidebarWidth,
}: AdminLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: "/admin" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Key, label: t('nav.licenses'), path: "/admin/licenses" },
    { icon: Shield, label: t('nav.security'), path: "/admin/security" },
    { icon: Settings, label: t('nav.settings'), path: "/admin/settings" },
  ];
  
  const activeMenuItem = menuItems.find(item => item.path === location);
  
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-sidebar-border bg-sidebar"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display font-bold tracking-wider truncate">
                    <span className="text-primary">KSA</span>
                    <span className="text-muted-foreground">,</span>
                    <span className="text-secondary">Boom</span>
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-medium ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span>{item.label}</span>
                      {item.path === '/admin/security' && unreadCount && unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            
            {/* Home link */}
            <div className="mt-auto px-2 py-1">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setLocation('/')}
                    tooltip={t('nav.backToSite')}
                    className="h-10 text-muted-foreground hover:text-foreground"
                  >
                    <Home className="h-4 w-4" />
                    <span>{t('nav.backToSite')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-primary/50 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      Admin
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <div className="px-2 py-1.5">
                    <LanguageSwitcher variant="compact" className="w-full" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('nav.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-background">
        {isMobile && (
          <div className="flex border-b border-border h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-display tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Admin"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6 cyber-grid min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
