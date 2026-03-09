import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import MariaChat from "@/components/assistant/MariaChat";
import {
  LayoutDashboard,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ShoppingCart,
  Crown,
  Settings,
  LogOut,
  Menu,
  Bell,
  Wallet,
  Building2,
  BookOpen,
  Cake,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import logo from "@/assets/logo.png";

const sidebarNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Informações da Empresa", icon: Building2, path: "/business-info" },
  { label: "Precificação", icon: DollarSign, path: "/pricing" },
  { label: "Produtos", icon: Cake, path: "/pricing?mode=product" },
  { label: "Insumos", icon: Package, path: "/supplies" },
  { label: "Receitas", icon: BookOpen, path: "/pricing?mode=recipe" },
  { label: "Cadastro de Clientes", icon: Users, path: "/clients" },
  { label: "Encomendas", icon: ShoppingBag, path: "/orders" },
  { label: "Cardápio Digital", icon: UtensilsCrossed, path: "/menu" },
  { label: "Suas Finanças", icon: Wallet, path: "/finance" },
  { label: "Calculadora de Compras", icon: ShoppingCart, path: "/shopping" },
  { label: "Planos", icon: Crown, path: "/plans" },
  { label: "Configurações", icon: Settings, path: "/settings" },
];

const bottomNav = [
  { label: "Painel", icon: LayoutDashboard, path: "/" },
  { label: "Preços", icon: DollarSign, path: "/pricing", highlight: true },
  { label: "Encomendas", icon: ShoppingBag, path: "/orders" },
  { label: "Planos", icon: Crown, path: "/plans" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const NavItem = ({ item, onClick }: { item: typeof sidebarNav[0]; onClick?: () => void }) => (
    <button
      onClick={() => { navigate(item.path); onClick?.(); }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left",
        isActive(item.path)
          ? "bg-success text-success-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon className="w-5 h-5 shrink-0" />
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
              <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center md:hidden">
                <Menu className="w-5 h-5 text-primary" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <div className="flex items-center gap-2 mb-6">
                <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
                <span className="font-bold text-lg text-foreground">Doce Preço</span>
              </div>
              <nav className="space-y-1">
                {sidebarNav.map((item) => (
                  <NavItem key={item.path} item={item} onClick={() => setOpen(false)} />
                ))}
              </nav>
              <div className="mt-6 pt-4 border-t border-border">
                <button onClick={() => { signOut(); navigate("/auth"); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden md:flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-foreground">Doce Preço Fácil</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left md:ml-4">
          <p className="text-xs text-muted-foreground leading-none">{getGreeting()},</p>
          <p className="text-sm font-bold text-foreground">{profile?.name?.trim() ? `${profile.name} 🌸` : "Oi! 👋"}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-primary" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/auth"); }} className="text-muted-foreground hover:text-destructive hidden md:flex">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card/50 p-3 gap-1 overflow-y-auto">
          <nav className="space-y-1 flex-1">
            {sidebarNav.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </aside>

        <main className="flex-1 pb-20 md:pb-6 overflow-auto">
          <div className="container max-w-4xl py-4 md:py-6 px-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex justify-around items-end py-2 px-1">
        {bottomNav.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors min-w-0",
              isActive(item.path) ? "text-success font-bold" : "text-muted-foreground"
            )}
          >
            {item.highlight ? (
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg",
                "bg-primary"
              )}>
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
            ) : (
              <item.icon className={cn("w-5 h-5", isActive(item.path) && "text-success")} />
            )}
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Maria Chat Assistant */}
      <MariaChat />
    </div>
  );
};

export default AppLayout;