import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Trash2, Wallet, CreditCard, Smartphone } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const incomeCategories = ["Bolos", "Encomendas", "Fatias", "Doces", "Salgados", "Cupcakes", "Outros"];
const expenseCategories = ["Ingredientes", "Embalagens", "Luz", "Gás", "Uber/99", "Aplicativos", "Entregador", "Compras", "Outros"];
const COLORS = ["hsl(152, 70%, 38%)", "hsl(30, 60%, 58%)", "hsl(340, 75%, 55%)", "hsl(280, 50%, 55%)", "hsl(200, 60%, 50%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

const paymentMethods = [
  { value: "pix", label: "Pix", icon: Smartphone },
  { value: "debito", label: "Débito", icon: CreditCard },
  { value: "credito", label: "Crédito", icon: CreditCard },
];

const Finance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogType, setDialogType] = useState<"income" | "expense" | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [supplier, setSupplier] = useState("");
  const [description, setDescription] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: inc }, { data: exp }] = await Promise.all([
      supabase.from("financial_income").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("financial_expense").select("*").eq("user_id", user.id).order("date", { ascending: false }),
    ]);
    setIncomes(inc || []);
    setExpenses(exp || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleSave = async () => {
    if (!user || !amount) return;
    if (dialogType === "income") {
      await supabase.from("financial_income").insert({
        user_id: user.id, amount: Number(amount), category, date, payment_method: paymentMethod, client_name: clientName, notes,
      });
    } else {
      await supabase.from("financial_expense").insert({
        user_id: user.id, amount: Number(amount), category, date, supplier, description,
      });
    }
    toast({ title: dialogType === "income" ? "Entrada registrada! 💚" : "Saída registrada! 📝" });
    setDialogType(null);
    setAmount(""); setCategory(""); setNotes(""); setSupplier(""); setDescription(""); setClientName("");
    fetchData();
  };

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = expenses.reduce((acc: Record<string, number>, e) => {
    const cat = e.category || "Outros";
    acc[cat] = (acc[cat] || 0) + Number(e.amount);
    return acc;
  }, {});
  const chartData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mx-auto shadow-lg">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Suas Finanças</h1>
        <p className="text-sm text-muted-foreground">Controle suas entradas e saídas de forma simples 💰</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-elevated border-success/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-success" />
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-xl font-extrabold text-success">R$ {totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated border-destructive/20">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto mb-1 text-destructive" />
            <p className="text-xs text-muted-foreground">Lançamentos</p>
            <p className="text-xl font-extrabold text-destructive">R$ {totalExpense.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Balance indicator */}
      <Card className={`card-elevated ${balance >= 0 ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">{balance >= 0 ? "Você está no positivo! 🎉" : "Atenção! Você está no negativo 😟"}</p>
          <p className={`text-2xl font-extrabold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
            {balance >= 0 ? "+" : ""}R$ {balance.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => setDialogType("income")} className="rounded-xl flex-1 h-12 font-bold bg-success hover:bg-success/90 text-success-foreground" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
          + Entrada
        </Button>
        <Button onClick={() => setDialogType("expense")} className="rounded-xl flex-1 h-12 font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground" style={{ boxShadow: "0 4px 0 0 hsl(0 62% 42%), 0 6px 12px -2px hsl(0 62% 50% / 0.3)" }}>
          + Saída
        </Button>
      </div>

      {/* Expense chart */}
      {chartData.length > 0 && (
        <Card className="card-elevated">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-foreground mb-2">📊 Gastos por categoria</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v: string) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={!!dialogType} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === "income" ? <><TrendingUp className="w-5 h-5 text-success" /> Registrar entrada</> : <><TrendingDown className="w-5 h-5 text-destructive" /> Registrar saída</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Quanto você {dialogType === "income" ? "recebeu" : "gastou"}?</label>
              <Input type="number" step="0.01" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl text-lg font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(dialogType === "income" ? incomeCategories : expenseCategories).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Data</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" />
            </div>
            {dialogType === "income" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Como você recebeu?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(pm => (
                      <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === pm.value ? "bg-success/10 border-success text-success font-bold shadow-md scale-105" : "border-border bg-secondary/30 text-muted-foreground"}`}
                        style={paymentMethod === pm.value ? { boxShadow: "0 3px 0 0 hsl(152 70% 28%)" } : {}}>
                        <pm.icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Input placeholder="Nome do cliente (opcional)" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Observação (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12 rounded-xl" />
              </>
            )}
            {dialogType === "expense" && (
              <>
                <Input placeholder="Fornecedor (opcional)" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 rounded-xl" />
              </>
            )}
            <Button onClick={handleSave} className={`w-full rounded-xl h-12 font-bold ${dialogType === "income" ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-destructive hover:bg-destructive/90"}`}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* List */}
      <Tabs defaultValue="income">
        <TabsList className="grid grid-cols-2 w-full h-12 rounded-xl">
          <TabsTrigger value="income" className="rounded-xl font-bold">💚 Entradas</TabsTrigger>
          <TabsTrigger value="expense" className="rounded-xl font-bold">🔴 Saídas</TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          {incomes.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nenhuma entrada ainda" description="Registre suas vendas para acompanhar seus ganhos." />
          ) : (
            <div className="grid gap-3 mt-4">
              {incomes.map((i) => (
                <Card key={i.id} className="card-elevated"><CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-success">+ R$ {Number(i.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{i.category} • {new Date(i.date).toLocaleDateString("pt-BR")}</p>
                    {i.payment_method && <p className="text-xs text-muted-foreground uppercase">{i.payment_method}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("financial_income").delete().eq("id", i.id); fetchData(); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="expense">
          {expenses.length === 0 ? (
            <EmptyState icon={TrendingDown} title="Nenhuma saída ainda" description="Registre suas despesas para controlar seus gastos." />
          ) : (
            <div className="grid gap-3 mt-4">
              {expenses.map((e) => (
                <Card key={e.id} className="card-elevated"><CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-destructive">- R$ {Number(e.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{e.category} • {new Date(e.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={async () => { await supabase.from("financial_expense").delete().eq("id", e.id); fetchData(); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
