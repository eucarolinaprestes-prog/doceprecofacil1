import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown, ShoppingCart, ShoppingBag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const name = profile?.name || "Confeiteira";

  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

    Promise.all([
      supabase.from("financial_income").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("financial_expense").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("orders").select("*, clients(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]).then(([{ data: inc }, { data: exp }, { data: ord }]) => {
      setIncomes(inc || []);
      setExpenses(exp || []);
      setOrders(ord || []);

      const activity: any[] = [];
      (inc || []).slice(0, 3).forEach(i => activity.push({ type: "income", text: `Entrada: R$ ${Number(i.amount).toFixed(2)}`, sub: i.category, date: i.date }));
      (ord || []).slice(0, 3).forEach(o => activity.push({ type: "order", text: `Encomenda: ${o.clients?.name || "Cliente"}`, sub: o.category, date: o.created_at?.split("T")[0] }));
      setRecentActivity(activity.sort((a, b) => b.date?.localeCompare(a.date || "") || 0).slice(0, 5));
    });
  }, [user]);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalIncome - totalExpense;

  const orderDates = orders.reduce((acc: Record<string, number>, o) => {
    if (o.event_date) {
      const d = format(new Date(o.event_date), "yyyy-MM-dd");
      acc[d] = (acc[d] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Date */}
      <p className="text-xs text-muted-foreground capitalize">{format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>

      {/* CTA Hero - Rosa vibrante */}
      <button
        onClick={() => navigate("/pricing")}
        className="w-full rounded-2xl p-5 flex items-center justify-between gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        style={{ boxShadow: "0 6px 0 0 hsl(340 75% 38%), 0 10px 20px -4px hsl(340 75% 55% / 0.4)" }}
      >
        <div className="text-left">
          <p className="text-lg font-extrabold">Oi, {name}! 👋</p>
          <p className="text-sm font-bold opacity-90 mt-0.5">Vamos precificar hoje?</p>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Calculator className="w-7 h-7 text-primary-foreground" />
        </div>
      </button>

      {/* Resumo do mês - setas */}
      <Card className="card-elevated overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground mb-4">📊 Resumo do mês</p>
          <div className="grid grid-cols-3 gap-3">
            {/* Entradas */}
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-success/10">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-success" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Entradas</p>
              <p className="text-sm font-extrabold text-success">R$ {totalIncome.toFixed(2)}</p>
            </div>
            {/* Saídas */}
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-destructive/10">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Saídas</p>
              <p className="text-sm font-extrabold text-destructive">R$ {totalExpense.toFixed(2)}</p>
            </div>
            {/* Lucro */}
            <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${profit >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profit >= 0 ? "bg-success/20" : "bg-destructive/20"}`}>
                {profit >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Lucro</p>
              <p className={`text-sm font-extrabold ${profit >= 0 ? "text-success" : "text-destructive"}`}>R$ {profit.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/finance")}
          className="rounded-2xl h-16 bg-success text-success-foreground font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 0 0 hsl(152 70% 26%), 0 8px 16px -4px hsl(152 70% 38% / 0.35)" }}
        >
          <TrendingUp className="w-5 h-5" />
          <span>+ Entrada</span>
        </button>
        <button
          onClick={() => navigate("/finance")}
          className="rounded-2xl h-16 bg-destructive text-destructive-foreground font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 0 0 hsl(0 62% 40%), 0 8px 16px -4px hsl(0 84% 60% / 0.35)" }}
        >
          <TrendingDown className="w-5 h-5" />
          <span>+ Saída</span>
        </button>
        <button
          onClick={() => navigate("/shopping")}
          className="rounded-2xl h-16 gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 0 0 hsl(340 75% 38%), 0 8px 16px -4px hsl(340 75% 55% / 0.35)" }}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Calculadora</span>
        </button>
        <button
          onClick={() => navigate("/orders")}
          className="rounded-2xl h-16 gradient-gold text-white font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 0 0 hsl(30 60% 40%), 0 8px 16px -4px hsl(30 60% 58% / 0.35)" }}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Nova Encomenda</span>
        </button>
      </div>

      {/* Atividades recentes */}
      {recentActivity.length > 0 && (
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-foreground mb-3">🕐 Atividades recentes</p>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.type === "income" ? "bg-success/10" : "bg-primary/10"}`}>
                    {a.type === "income" ? <TrendingUp className="w-4 h-4 text-success" /> : <ShoppingBag className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.sub} {a.date ? `• ${new Date(a.date).toLocaleDateString("pt-BR")}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default Dashboard;
