import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Settings, BookOpen, MessageSquare, BarChart3, Code, Mail, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

function buildPath(basePath: string): string {
  return basePath;
}

const NAV_LINKS = [
  { href: "/", label: "Settings", icon: Settings, description: "Bot configuration" },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen, description: "FAQ & content" },
  { href: "/test-chat", label: "Test Chat", icon: MessageSquare, description: "Live testing" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Performance metrics" },
  { href: "/email-composer", label: "Email Composer", icon: Mail, description: "Edit proposal visually" },
  { href: "/embed", label: "Embed Widget", icon: Code, description: "Deploy & customize" },
];

export function SidebarNavigation() {
  const [currentPath] = useLocation();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="px-6 py-6">
        <Logo layout="horizontal" size="sm" />
        <div className="separator-gold mt-5" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
          Manage
        </p>
        {NAV_LINKS.map((link) => {
          const isActive = currentPath === link.href;
          const hrefWithLocation = buildPath(link.href);
          const Icon = link.icon;
          return (
            <Link key={link.href} href={hrefWithLocation}>
              <span
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                )}

                <Icon
                  className={cn(
                    "w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />

                <div className="flex-1 min-w-0">
                  <span className="block leading-tight">{link.label}</span>
                  <span
                    className={cn(
                      "block text-[11px] font-normal leading-tight mt-0.5 transition-colors duration-200",
                      isActive ? "text-primary/60" : "text-muted-foreground/50"
                    )}
                  >
                    {link.description}
                  </span>
                </div>

                <ChevronRight
                  className={cn(
                    "w-3.5 h-3.5 flex-shrink-0 transition-all duration-200",
                    isActive
                      ? "text-primary/50 opacity-100"
                      : "text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:-translate-x-0 translate-x-1"
                  )}
                />
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5">
        <div className="separator-gold mb-4" />
        <p className="text-[11px] text-muted-foreground/40 font-medium tracking-wide">
          PHNTM AI &middot; Control Center
        </p>
      </div>
    </aside>
  );
}

/* Keep the old export for backwards compat with any imports */
export function TopNavigation() {
  return <SidebarNavigation />;
}
