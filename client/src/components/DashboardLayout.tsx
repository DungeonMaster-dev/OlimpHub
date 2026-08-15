import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Compass,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  Network,
  PanelLeft,
  Settings,
  Sparkles,
  Trophy,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "Today", path: "/" },
  { icon: Compass, label: "Explore", path: "/problems" },
  { icon: BookOpen, label: "Training", path: "/training" },
  { icon: Trophy, label: "Contests", path: "/contests" },
  { icon: FileCheck2, label: "Verdicts", path: "/submissions" },
  { icon: Network, label: "Skill map", path: "/skills" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "olymp-sidebar-width";
const DEFAULT_WIDTH = 260;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(
    () => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH
  );
  const { loading, user } = useAuth();
  useEffect(
    () => localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth)),
    [sidebarWidth]
  );

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-5">
        <div className="max-w-md text-center space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 shadow-2xl shadow-black/30">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-400 text-slate-950">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <div>
            <p className="eyebrow">PRIVATE WORKSPACE</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Your practice, in focus.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in with your Manus account to keep attempts, notes, and
              progress private.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            className="w-full rounded-xl bg-indigo-300 text-slate-950 hover:bg-indigo-200"
          >
            Continue with Manus
          </Button>
        </div>
      </div>
    );
  }
  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <WorkspaceShell setSidebarWidth={setSidebarWidth}>
        {children}
      </WorkspaceShell>
    </SidebarProvider>
  );
}

function WorkspaceShell({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [resizing, setResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const current =
    menuItems.find(item => item.path === location) ??
    menuItems.find(
      item => location.startsWith(item.path) && item.path !== "/"
    ) ??
    menuItems[0];
  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (resizing)
        setSidebarWidth(
          Math.min(
            360,
            Math.max(
              220,
              event.clientX -
                (sidebarRef.current?.getBoundingClientRect().left ?? 0)
            )
          )
        );
    };
    const up = () => setResizing(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [resizing, setSidebarWidth]);
  return (
    <>
      <div ref={sidebarRef} className="relative">
        <Sidebar
          collapsible="icon"
          className="border-r border-white/[0.07] bg-[#090d19]/92 backdrop-blur-xl"
        >
          <SidebarHeader className="h-[76px] justify-center px-3">
            <div className="flex w-full items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-300 transition hover:bg-white/[0.08]"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {state !== "collapsed" && (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-indigo-300 text-[11px] text-slate-950">
                      O
                    </span>{" "}
                    OlimpHub
                  </div>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Practice studio
                  </p>
                </div>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent className="pt-3">
            <SidebarMenu className="gap-1 px-3">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={current?.path === item.path}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-11 rounded-xl px-3 text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-100 data-[active=true]:bg-indigo-400/12 data-[active=true]:text-indigo-200"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            {state !== "collapsed" && (
              <div className="mx-3 mt-8 rounded-2xl border border-indigo-300/10 bg-gradient-to-br from-indigo-400/10 to-cyan-300/5 p-4">
                <Sparkles className="h-4 w-4 text-indigo-200" />
                <p className="mt-3 text-sm font-medium text-slate-100">
                  Think in systems.
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Keep a trace of every attempt, not only the verdict.
                </p>
              </div>
            )}
          </SidebarContent>
          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.05]">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-slate-800 text-xs text-indigo-100">
                      {user?.name?.slice(0, 1).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm text-slate-200">
                      {user?.name ?? "Learner"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      Private workspace
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {state !== "collapsed" && (
          <div
            className="absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize hover:bg-indigo-300/30"
            onMouseDown={() => setResizing(true)}
          />
        )}
      </div>
      <SidebarInset className="bg-[#0c1020]">
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#0c1020]/75 px-5 backdrop-blur-xl md:px-8">
          {isMobile && <SidebarTrigger className="mr-3" />}
          <div>
            <p className="eyebrow">OLIMPHUB / {current?.label.toUpperCase()}</p>
            <h2 className="mt-1 text-lg font-medium tracking-tight text-slate-100">
              {current?.label}
            </h2>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Private & synced locally
          </div>
        </header>
        <main className="min-h-[calc(100vh-76px)] px-5 py-7 md:px-8 lg:px-10">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
