import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown, ShoppingCart, ShoppingBag, ArrowUpRight, ArrowDownRight, CalendarDays, AlertTriangle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, subMonths, isToday, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import FinanceDialog from "@/components/dashboard/FinanceDialog";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const displayName = profile?.name || "Confeiteira";

  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(today);
  const [dialogType, setDialogType] = useState<"income" | "expense" | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchData = () => {
    if (!user) return;
    const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");

    Promise.all([
      supabase.from("financial_income").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("financial_expense").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("orders").select("*, clients(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("ingredients").select("id, name, current_stock, min_stock, unit").eq("user_id", user.id),
      supabase.from("packaging").select("id, name, current_stock, min_stock, unit").eq("user_id", user.id),
    ]).then(([{ data: inc }, { data: exp }, { data: ord }, { data: ing }, { data: pkg }]) => {
      setIncomes(inc || []);
      setExpenses(exp || []);
      setOrders(ord || []);

      // Low stock alerts
      const lowItems: any[] = [];
      (ing || []).forEach(i => {
        if (i.min_stock && i.min_stock > 0 && (i.current_stock || 0) <= i.min_stock) {
          lowItems.push({ ...i, type: "ingredient" });
        }
      });
      (pkg || []).forEach(p => {
        if (p.min_stock && p.min_stock > 0 && (p.current_stock || 0) <= p.min_stock) {
          lowItems.push({ ...p, type: "packaging" });
        }
      });
      setLowStockItems(lowItems);

      const activity: any[] = [];
      (inc || []).slice(0, 3).forEach(i => activity.push({ type: "income", text: `Entrada: R$ ${Number(i.amount).toFixed(2)}`, sub: i.category, date: i.date }));
      (exp || []).slice(0, 3).forEach(e => activity.push({ type: "expense", text: `Saída: R$ ${Number(e.amount).toFixed(2)}`, sub: e.category, date: e.date }));
      (ord || []).slice(0, 3).forEach(o => activity.push({ type: "order", text: `Encomenda: ${o.clients?.name || "Cliente"}`, sub: o.category, date: o.created_at?.split("T")[0] }));
      setRecentActivity(activity.sort((a, b) => b.date?.localeCompare(a.date || "") || 0).slice(0, 5));
    });
  };

  useEffect(() => { fetchData(); }, [user]);

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalIncome - totalExpense;


  // Calendar
  const orderDates = orders.reduce((acc: Record<string, number>, o) => {
    if (o.event_date) {
      const d = format(new Date(o.event_date), "yyyy-MM-dd");
      acc[d] = (acc[d] || 0) + 1;
    }
    return acc;
  }, {});

  const calStart = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 });
  const calDays = Array.from({ length: 42 }, (_, i) => addDays(calStart, i));

  return (
    <div className="space-y-5">
      {/* Date */}
      <p className="text-xs text-muted-foreground capitalize">{format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>

      {/* CTA Hero */}
      <button
        onClick={() => navigate("/pricing")}
        className="w-full rounded-2xl p-6 flex items-center justify-between text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, hsl(340 70% 58%), hsl(340 65% 65%))", boxShadow: "0 6px 0 0 hsl(340 70% 48%), 0 10px 20px -4px hsl(340 70% 58% / 0.4)" }}
      >
        <div className="text-left">
          <p className="text-lg font-extrabold">Oi, {displayName}! 👋</p>
          <p className="text-xl font-extrabold opacity-95 mt-1 tracking-wide uppercase">VAMOS PRECIFICAR HOJE?</p>
        </div>
        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Calculator className="w-8 h-8 text-primary-foreground" />
        </div>
      </button>

      {/* Resumo do mês - setas */}
      <Card className="card-elevated overflow-hidden">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground mb-4">📊 Resumo do mês</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-success/10">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-success" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Entradas</p>
              <p className="text-sm font-extrabold text-success">R$ {totalIncome.toFixed(2)}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-destructive/10">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Saídas</p>
              <p className="text-sm font-extrabold text-destructive">R$ {totalExpense.toFixed(2)}</p>
            </div>
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
          onClick={() => setDialogType("income")}
          className="rounded-2xl h-16 bg-success text-success-foreground font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 0 0 hsl(152 70% 26%), 0 8px 16px -4px hsl(152 70% 38% / 0.35)" }}
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Adicionar Entrada</span>
        </button>
        <button
          onClick={() => setDialogType("expense")}
          className="rounded-2xl h-16 bg-destructive text-destructive-foreground font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ boxShadow: "0 4px 0 0 hsl(0 62% 40%), 0 8px 16px -4px hsl(0 84% 60% / 0.35)" }}
        >
          <ArrowDownRight className="w-5 h-5" />
          <span>Adicionar Saída</span>
        </button>
        <button
          onClick={() => navigate("/shopping")}
          className="rounded-2xl h-16 text-white font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ background: "linear-gradient(135deg, hsl(40 80% 55%), hsl(45 75% 60%))", boxShadow: "0 4px 0 0 hsl(40 80% 42%), 0 8px 16px -4px hsl(40 80% 55% / 0.35)" }}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Calculadora de Compras</span>
        </button>
        <button
          onClick={() => navigate("/orders")}
          className="rounded-2xl h-16 text-white font-bold flex items-center justify-center gap-2 text-sm active:translate-y-0.5 transition-all"
          style={{ background: "linear-gradient(135deg, hsl(270 45% 65%), hsl(280 40% 72%))", boxShadow: "0 4px 0 0 hsl(270 45% 50%), 0 8px 16px -4px hsl(270 45% 65% / 0.35)" }}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Nova Encomenda</span>
        </button>
      </div>

      {/* Calendário mensal */}
      <Card className="card-elevated border border-rose-200 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg, hsl(340 70% 58%), hsl(340 65% 65%))" }}>
          <button onClick={() => setCalendarMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <div className="text-center">
            <p className="text-sm font-extrabold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Calendário de Encomendas
            </p>
            <p className="text-xs text-white/80 font-semibold capitalize mt-0.5">
              {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
          <button onClick={() => setCalendarMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-3">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="text-center text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {calDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const hasOrder = orderDates[dateStr];
              const inMonth = isSameMonth(day, calendarMonth);
              const isFuture = hasOrder && new Date(dateStr) >= new Date(format(today, "yyyy-MM-dd"));
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => hasOrder && inMonth ? setSelectedDate(selectedDate === dateStr ? null : dateStr) : setSelectedDate(null)}
                  className={`flex flex-col items-center py-2 rounded-xl text-xs font-semibold relative transition-all cursor-pointer ${
                    !inMonth ? "opacity-20" :
                    isToday(day) ? "text-white shadow-lg scale-105" :
                    hasOrder && isFuture ? "bg-success text-success-foreground font-extrabold shadow-sm" :
                    hasOrder ? "bg-success/15 text-success font-extrabold border border-success/30" :
                    "text-foreground hover:bg-muted/50"
                  }`}
                  style={isToday(day) && inMonth ? { background: "linear-gradient(135deg, hsl(340 70% 58%), hsl(340 65% 65%))" } : undefined}
                >
                  <span className="text-sm font-bold">{format(day, "d")}</span>
                  {hasOrder && inMonth && (
                    <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isToday(day) ? "bg-white" : "bg-success-foreground"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Order detail popup */}
          {selectedDate && (() => {
            const dayOrders = orders.filter(o => o.event_date && format(new Date(o.event_date), "yyyy-MM-dd") === selectedDate);
            if (dayOrders.length === 0) return null;
            return (
              <div className="mt-3 space-y-2">
                {dayOrders.map(o => {
                  const total = Number(o.total_value || 0);
                  const paidPercent = o.payment_percent || 100;
                  const paid = total * paidPercent / 100;
                  const remaining = total - paid;
                  return (
                    <div key={o.id} className="rounded-xl bg-success/10 border border-success/30 p-3 flex flex-col gap-1.5 relative">
                      <button onClick={() => setSelectedDate(null)} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted/80 flex items-center justify-center">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                      <p className="text-sm font-extrabold text-foreground">👤 {o.clients?.name || "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">🎂 {o.category || "Encomenda"}{o.size ? ` • ${o.size}` : ""}{o.filling ? ` • ${o.filling}` : ""}</p>
                      <p className="text-xs text-muted-foreground">📅 {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-foreground">💰 R$ {total.toFixed(2)}</span>
                        {paidPercent < 100 ? (
                          <span className="text-xs font-bold text-destructive">Falta R$ {remaining.toFixed(2)}</span>
                        ) : (
                          <span className="text-xs font-bold text-success">✅ Pago</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Atividades recentes */}
      {recentActivity.length > 0 && (
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-foreground mb-3">🕐 Atividades recentes</p>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${a.type === "income" ? "bg-success/10" : a.type === "expense" ? "bg-destructive/10" : "bg-primary/10"}`}>
                    {a.type === "income" ? <ArrowUpRight className="w-4 h-4 text-success" /> : a.type === "expense" ? <ArrowDownRight className="w-4 h-4 text-destructive" /> : <ShoppingBag className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${a.type === "income" ? "text-success" : a.type === "expense" ? "text-destructive" : "text-foreground"}`}>{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.sub} {a.date ? `• ${new Date(a.date).toLocaleDateString("pt-BR")}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de estoque baixo */}
      {lowStockItems.length > 0 && (
        <Card className="card-elevated border-warning/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">⚠️ Estoque baixo</p>
                <p className="text-[10px] text-muted-foreground">{lowStockItems.length} {lowStockItems.length === 1 ? "item precisa" : "itens precisam"} de reposição</p>
              </div>
            </div>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/supplies?tab=${item.type === "ingredient" ? "ingredients" : "packaging"}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-warning/10 border border-warning/20 cursor-pointer hover:bg-warning/15 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.type === "ingredient" ? "Ingrediente" : "Embalagem"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-warning">{Number(item.current_stock || 0)} {item.unit}</p>
                    <p className="text-[10px] text-muted-foreground">mín: {item.min_stock} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FinanceDialog type={dialogType} onClose={() => setDialogType(null)} onSaved={fetchData} />
    </div>
  );
};

export default Dashboard;