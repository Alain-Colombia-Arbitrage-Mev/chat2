import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientConfig } from "@/lib/api";

export function Header() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const user = params.get("user") || "Admin User";

  const { data: config } = useQuery({
    queryKey: ["client-config"],
    queryFn: () => getClientConfig(),
  });

  const clientName = config?.accountName || "AI Control Center";
  const agentId = config?.agentId || "default";

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex flex-col">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Agent</h2>
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-foreground text-sm md:text-base">{clientName}</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono border border-primary/20">
            {agentId}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 h-9 w-64 rounded-full bg-muted/50 border-none text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all hover:bg-muted focus:bg-background"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-card"></span>
        </Button>

        <div className="h-8 w-px bg-border mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-foreground">{user}</div>
            <div className="text-xs text-muted-foreground">Admin</div>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
            {user.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
