import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Target,
  LogOut,
  Cake,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Receitas", icon: BookOpen, path: "/recipes" },
  { label: "Estoque", icon: Package, path: "/inventory" },
  { label: "Encomendas", icon: ShoppingBag, path: "/orders" },
  { label: "Clientes", icon: Users, path: "/clients" },
];

const extraNav = [
  { label: "Financeiro", icon: DollarSign, path: "/financial" },
  { label: "Metas", icon: Target, path: "/goals" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item, onClick }: { item: typeof mainNav[0]; onClick?: () => void }) => (
    <button
      onClick={() => { navigate(item.path); onClick?.(); }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left",
        isActive(item.path)
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon className="w-5 h-5" />
      <span>{item.label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Cake className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-lg">Doce Preço</span>
              </div>
              <nav className="space-y-1">
                {[...mainNav, ...extraNav].map((item) => (
                  <NavItem key={item.path} item={item} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="mt-auto pt-6">
                <button onClick={() => { logout(); navigate("/login"); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cake className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold">Doce Preço Fácil</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">Olá, {user?.name}</span>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate("/login"); }} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-border bg-card/50 p-3 gap-1">
          <nav className="space-y-1 flex-1">
            {mainNav.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
            <div className="border-t border-border my-3" />
            {extraNav.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 pb-20 md:pb-6 overflow-auto">
          <div className="container max-w-4xl py-4 md:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t border-border flex justify-around py-2 px-1">
        {mainNav.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors min-w-0",
              isActive(item.path) ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive(item.path) && "text-primary")} />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default AppLayout;
