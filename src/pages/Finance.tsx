import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const incomeCategories = ["bolos", "encomendas", "fatias", "doces", "salgados"];
const expenseCategories = ["ingredientes", "embalagens", "luz", "gás", "uber/99", "aplicativos", "entregador", "compras"];

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
  const [paymentMethod, setPaymentMethod] = useState("");
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
    toast({ title: dialogType === "income" ? "Entrada registrada!" : "Saída registrada!" });
    setDialogType(null);
    setAmount(""); setCategory(""); setNotes(""); setSupplier(""); setDescription(""); setClientName("");
    fetchData();
  };

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Finanças</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="w-6 h-6 mx-auto mb-1 text-success" />
          <p className="text-xs text-muted-foreground">Entradas</p>
          <p className="text-lg font-bold text-success">R$ {totalIncome.toFixed(2)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingDown className="w-6 h-6 mx-auto mb-1 text-destructive" />
          <p className="text-xs text-muted-foreground">Saídas</p>
          <p className="text-lg font-bold text-destructive">R$ {totalExpense.toFixed(2)}</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setDialogType("income")} className="rounded-xl flex-1 bg-success hover:bg-success/90">+ Entrada</Button>
        <Button onClick={() => setDialogType("expense")} variant="destructive" className="rounded-xl flex-1">+ Saída</Button>
      </div>

      <Dialog open={!!dialogType} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogType === "income" ? "Nova entrada" : "Nova saída"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" step="0.01" placeholder="Valor (R$)" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {(dialogType === "income" ? incomeCategories : expenseCategories).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" />
            {dialogType === "income" ? (
              <>
                <Input placeholder="Forma de pagamento" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Nome do cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Observação" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12 rounded-xl" />
              </>
            ) : (
              <>
                <Input placeholder="Fornecedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 rounded-xl" />
              </>
            )}
            <Button onClick={handleSave} className="w-full rounded-xl h-12">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="income">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="income">Entradas</TabsTrigger>
          <TabsTrigger value="expense">Saídas</TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          {incomes.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Nenhuma entrada registrada" description="Registre suas vendas e entradas aqui." />
          ) : (
            <div className="grid gap-3 mt-4">
              {incomes.map((i) => (
                <Card key={i.id}><CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-success">+ R$ {Number(i.amount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{i.category} • {new Date(i.date).toLocaleDateString("pt-BR")}</p>
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
            <EmptyState icon={TrendingDown} title="Nenhuma saída registrada" description="Registre suas despesas aqui." />
          ) : (
            <div className="grid gap-3 mt-4">
              {expenses.map((e) => (
                <Card key={e.id}><CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-destructive">- R$ {Number(e.amount).toFixed(2)}</p>
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
