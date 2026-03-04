import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { mockTransactions } from "@/services/mockData";
import type { FinancialTransaction, TransactionType } from "@/types";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Encomendas", "Ingredientes", "Embalagens", "Energia", "Gás", "Marketing", "Outros"];

const Financial = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(mockTransactions);
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [type, setType] = useState<TransactionType>("income");
  const [category, setCategory] = useState("Encomendas");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState("");

  const resetForm = () => { setType("income"); setCategory("Encomendas"); setDescription(""); setAmount(0); setDate(""); };

  const save = () => {
    const tx: FinancialTransaction = {
      id: crypto.randomUUID(), user_id: "u1", type, category, description, amount, date, related_order_id: null, created_at: new Date().toISOString(),
    };
    setTransactions([tx, ...transactions]);
    setDialogOpen(false); resetForm();
    toast({ title: "Transação registrada!" });
  };

  const filtered = filterType === "all" ? transactions : transactions.filter((t) => t.type === filterType);
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Nova</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="income">Receita</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Valor R$" value={amount} onChange={(e) => setAmount(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button onClick={save} className="w-full h-11 rounded-xl" disabled={!description || amount <= 0}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-success/30 bg-success/5"><CardContent className="p-3 text-center"><TrendingUp className="w-4 h-4 text-success mx-auto mb-1" /><p className="text-xs text-muted-foreground">Receitas</p><p className="font-bold text-sm text-success">R$ {totalIncome.toFixed(2)}</p></CardContent></Card>
        <Card className="border-destructive/30 bg-destructive/5"><CardContent className="p-3 text-center"><TrendingDown className="w-4 h-4 text-destructive mx-auto mb-1" /><p className="text-xs text-muted-foreground">Despesas</p><p className="font-bold text-sm text-destructive">R$ {totalExpense.toFixed(2)}</p></CardContent></Card>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="p-3 text-center"><DollarSign className="w-4 h-4 text-primary mx-auto mb-1" /><p className="text-xs text-muted-foreground">Saldo</p><p className="font-bold text-sm">R$ {(totalIncome - totalExpense).toFixed(2)}</p></CardContent></Card>
      </div>

      <div className="flex gap-2">
        <Button variant={filterType === "all" ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilterType("all")}>Todos</Button>
        <Button variant={filterType === "income" ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilterType("income")}>Receitas</Button>
        <Button variant={filterType === "expense" ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilterType("expense")}>Despesas</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma transação encontrada.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{t.description}</h3>
                  <p className="text-xs text-muted-foreground">{t.category} • {t.date}</p>
                </div>
                <Badge variant="outline" className={t.type === "income" ? "text-success border-success/40" : "text-destructive border-destructive/40"}>
                  {t.type === "income" ? "+" : "-"} R$ {t.amount.toFixed(2)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Financial;
