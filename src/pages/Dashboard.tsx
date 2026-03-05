import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Minus, ShoppingCart, ShoppingBag, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import EmptyState from "@/components/EmptyState";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Oi, {profile?.name || "Confeiteira"} 👋</h1>
        <p className="text-sm text-muted-foreground">Veja como está seu negócio hoje</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className={`flex flex-col items-center min-w-[48px] py-2 px-3 rounded-xl text-xs font-medium ${isToday(day) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            <span>{format(day, "EEE", { locale: ptBR })}</span>
            <span className="text-lg font-bold">{format(day, "d")}</span>
          </div>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <p className="text-lg font-bold text-foreground">Vamos precificar?</p>
            <p className="text-sm text-muted-foreground">Calcule o preço ideal dos seus produtos</p>
          </div>
          <Button onClick={() => navigate("/pricing")} className="rounded-xl gap-2">
            <Calculator className="w-4 h-4" /> Precificar agora
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Entradas", icon: TrendingUp, color: "text-success" },
          { label: "Saídas", icon: TrendingDown, color: "text-destructive" },
          { label: "Lucro", icon: DollarSign, color: "text-primary" },
        ].map((item) => (
          <Card key={item.label}><CardContent className="p-4 text-center">
            <item.icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xl font-bold text-foreground">R$ 0,00</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Adicionar entrada", icon: Plus, path: "/finance", color: "bg-success/10 text-success" },
          { label: "Adicionar saída", icon: Minus, path: "/finance", color: "bg-destructive/10 text-destructive" },
          { label: "Calculadora", icon: ShoppingCart, path: "/shopping", color: "bg-accent/10 text-accent" },
          { label: "Nova encomenda", icon: ShoppingBag, path: "/orders", color: "bg-primary/10 text-primary" },
        ].map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:bg-secondary transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Atividades recentes</h2>
        <EmptyState icon={Activity} title="Nenhuma atividade ainda" description="Suas atividades recentes aparecerão aqui conforme você usar o sistema." />
      </div>
    </div>
  );
};

export default Dashboard;
