import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutGrid, Sparkles } from "lucide-react";
import efimaxLogo from "@/assets/efimax-logo.webp";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  const navItem = (to: string, icon: ReactNode, label: string) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={efimaxLogo} alt="Efimax" className="h-9 w-auto" width={90} height={36} />
            <div className="hidden md:block h-8 w-px bg-border" />
            <h1 className="hidden md:block text-base font-semibold text-foreground">
              Painel de Conteúdo
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[200px]">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="container px-4 md:px-6 pb-2 flex gap-1 overflow-x-auto">
          {navItem("/", <LayoutGrid className="h-4 w-4" />, "Conteúdos buscados")}
          {navItem("/gerados", <Sparkles className="h-4 w-4" />, "Conteúdos gerados")}
        </nav>
      </header>
      <main className="container px-4 md:px-6 py-6 md:py-8 space-y-6">{children}</main>
    </div>
  );
}
