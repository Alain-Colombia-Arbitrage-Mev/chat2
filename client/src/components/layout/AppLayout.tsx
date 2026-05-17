import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Settings, BookOpen, MessageSquare, BarChart3, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNavigation } from "./TopNavigation";

interface AppLayoutProps {
  children: ReactNode;
}

const MOBILE_NAV_LINKS = [
  { href: "/", label: "Settings", icon: Settings },
  { href: "/knowledge-base", label: "Knowledge", icon: BookOpen },
  { href: "/test-chat", label: "Chat", icon: MessageSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/embed", label: "Embed", icon: Code },
];

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <SidebarNavigation />
      </div>

      {/* Mobile header */}
      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="pt-16 pb-20 px-4 md:pt-0 md:pb-0 md:p-10 lg:p-12">
          <div className="max-w-6xl page-enter">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-5 bg-background/95 backdrop-blur-md border-b border-border">
      <span className="font-brand font-black tracking-[0.15em] text-primary text-sm">
        ANCESTRO
      </span>
    </div>
  );
}

function MobileBottomNav() {
  const [currentPath] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 px-2 bg-background/95 backdrop-blur-md border-t border-border">
      {MOBILE_NAV_LINKS.map((link) => {
        const isActive = currentPath === link.href;
        const Icon = link.icon;
        return (
          <Link key={link.href} href={link.href}>
            <span
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
