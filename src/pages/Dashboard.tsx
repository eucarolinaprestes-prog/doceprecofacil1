import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, TrendingDown, ShoppingCart, ShoppingBag, Plus } from "lucide-react";
import { format, startOfWeek, addDays, isToday, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

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
      
      // Build recent activity
      const activity: any[] = [];
      (inc || []).slice(0, 3).forEach(i => activity.push({ type: "income", text: `Entrada: R$ ${Number(i.amount).toFixed(2)}`, sub: i.category, date: i.date }));
      (ord || []).slice(0, 3).forEach(o => activity.push({ type: "order", text: `Encomenda: ${o.clients?.name || "Cliente"}`, sub: o.category, date: o.created_at?.split("T")[0] }));
      setRecentActivity(activity.sort((a, b) => b.date?.localeCompare(a.date || "") || 0).slice(0, 5));
    });
  }, [user]);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalIncome - totalExpense;

  const chartData = [
    { name: "Entradas", value: totalIncome, fill: "hsl(152, 70%, 38%)" },
    { name: "Saídas", value: totalExpense, fill: "hsl(0, 84%, 60%)" },
    { name: "Lucro", value: Math.max(0, profit), fill: "hsl(152, 70%, 32%)" },
  ];

  // Orders happening today
  const orderDates = orders.reduce((acc: Record<string, number>, o) => {
    if (o.event_date) {
      const d = format(new Date(o.event_date), "yyyy-MM-dd");
      acc[d] = (acc[d] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Date and greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground capitalize">{format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <h2 className="text-xl font-extrabold text-foreground">Oi, {name}! 👋</h2>
          <p className="text-sm text-muted-foreground font-medium">Vamos precificar hoje?</p>
        </div>
        <button onClick={() => navigate("/pricing")} className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors">
          <Calculator className="w-8 h-8 text-success" />
        </button>
      </div>

      {/* Chart */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground mb-3">📊 Resumo do mês</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Bar key={i} dataKey="value" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Entradas</p>
              <p className="text-sm font-extrabold text-success">R$ {totalIncome.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Saídas</p>
              <p className="text-sm font-extrabold text-destructive">R$ {totalExpense.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lucro</p>
              <p className={`text-sm font-extrabold ${profit >= 0 ? "text-success" : "text-destructive"}`}>R$ {profit.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => navigate("/finance")} className="rounded-xl h-14 bg-success hover:bg-success/90 text-success-foreground font-bold gap-2 text-sm" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
          <TrendingUp className="w-5 h-5" /> + Entrada
        </Button>
        <Button onClick={() => navigate("/finance")} className="rounded-xl h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold gap-2 text-sm" style={{ boxShadow: "0 4px 0 0 hsl(0 62% 42%), 0 6px 12px -2px hsl(0 62% 50% / 0.3)" }}>
          <TrendingDown className="w-5 h-5" /> + Saída
        </Button>
        <Button onClick={() => navigate("/shopping")} variant="outline" className="rounded-xl h-14 font-bold gap-2 text-sm border-2">
          <ShoppingCart className="w-5 h-5" /> Calculadora
        </Button>
        <Button onClick={() => navigate("/orders")} variant="outline" className="rounded-xl h-14 font-bold gap-2 text-sm border-2">
          <ShoppingBag className="w-5 h-5" /> Nova Encomenda
        </Button>
      </div>

      {/* Recent Activity */}
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

      {/* Calendar */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground mb-3">📅 Semana atual</p>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const hasOrder = orderDates[dateStr];
              return (
                <div
                  key={day.toISOString()}
                  className={`flex flex-col items-center py-3 px-1 rounded-xl text-xs font-medium ${
                    isToday(day)
                      ? "bg-primary text-primary-foreground shadow-md"
                      : hasOrder
                      ? "bg-success/10 text-success border border-success/20"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="capitalize text-[10px]">{format(day, "EEE", { locale: ptBR })}</span>
                  <span className="text-lg font-extrabold">{format(day, "d")}</span>
                  {hasOrder && <span className="w-1.5 h-1.5 rounded-full bg-success mt-0.5" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
