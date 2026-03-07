import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface CostItem {
  id?: string;
  category: string;
  amount: number;
  frequency: string; // mensal, semanal, anual
}

const frequencies = [
  { value: "mensal", label: "Mensal" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "anual", label: "Anual" },
];

const BusinessInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [workDays, setWorkDays] = useState("");
  const [workHours, setWorkHours] = useState("");

  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([]);
  const [newFixedName, setNewFixedName] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");
  const [newFixedFreq, setNewFixedFreq] = useState("mensal");
  const [newVarName, setNewVarName] = useState("");
  const [newVarAmount, setNewVarAmount] = useState("");
  const [newVarFreq, setNewVarFreq] = useState("mensal");

  const hourlyRate =
    Number(desiredSalary) > 0 && Number(workDays) > 0 && Number(workHours) > 0
      ? Number(desiredSalary) / (Number(workDays) * 4.33 * Number(workHours))
      : 0;

  const toMonthly = (amount: number, freq: string) => {
    switch (freq) {
      case "semanal": return amount * 4.33;
      case "quinzenal": return amount * 2;
      case "anual": return amount / 12;
      default: return amount;
    }
  };

  const fixedTotal = fixedCosts.reduce((s, c) => s + toMonthly(c.amount, c.frequency), 0);
  const variableTotal = variableCosts.reduce((s, c) => s + toMonthly(c.amount, c.frequency), 0);
  const dailyFixed = fixedTotal / 30;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile) {
        setStoreName(profile.store_name || "");
        if (profile.desired_salary) setDesiredSalary(String(profile.desired_salary));
        if (profile.work_days_per_week) setWorkDays(String(profile.work_days_per_week));
        if (profile.work_hours_per_day) setWorkHours(String(profile.work_hours_per_day));
      }
      const { data: fc } = await supabase.from("fixed_costs").select("*").eq("user_id", user.id);
      setFixedCosts(fc?.map((c) => ({ id: c.id, category: c.category, amount: Number(c.amount), frequency: "mensal" })) || []);
      const { data: vc } = await supabase.from("variable_costs").select("*").eq("user_id", user.id);
      setVariableCosts(vc?.map((c) => ({ id: c.id, category: c.category, amount: Number(c.amount), frequency: "mensal" })) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const addFixedCost = () => {
    if (!newFixedName.trim() || !newFixedAmount) return;
    setFixedCosts([...fixedCosts, { category: newFixedName.trim(), amount: Number(newFixedAmount), frequency: newFixedFreq }]);
    setNewFixedName(""); setNewFixedAmount(""); setNewFixedFreq("mensal");
  };

  const addVariableCost = () => {
    if (!newVarName.trim() || !newVarAmount) return;
    setVariableCosts([...variableCosts, { category: newVarName.trim(), amount: Number(newVarAmount), frequency: newVarFreq }]);
    setNewVarName(""); setNewVarAmount(""); setNewVarFreq("mensal");
  };

  const removeFixed = (idx: number) => setFixedCosts(fixedCosts.filter((_, i) => i !== idx));
  const removeVariable = (idx: number) => setVariableCosts(variableCosts.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        store_name: storeName,
        desired_salary: Number(desiredSalary) || 0,
        work_days_per_week: Number(workDays) || 5,
        work_hours_per_day: Number(workHours) || 8,
      }).eq("user_id", user.id);

      await supabase.from("fixed_costs").delete().eq("user_id", user.id);
      if (fixedCosts.length > 0) {
        await supabase.from("fixed_costs").insert(
          fixedCosts.map((c) => ({ user_id: user.id, category: c.category, amount: toMonthly(c.amount, c.frequency) }))
        );
      }

      await supabase.from("variable_costs").delete().eq("user_id", user.id);
      if (variableCosts.length > 0) {
        await supabase.from("variable_costs").insert(
          variableCosts.map((c) => ({ user_id: user.id, category: c.category, amount: toMonthly(c.amount, c.frequency) }))
        );
      }

      toast({ title: "Informações salvas com sucesso! ✅" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">🧾 Financeiro</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus custos fixos e mão de obra</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="gradient-primary p-4 rounded-2xl text-primary-foreground">
          <p className="text-xs font-medium opacity-80">Total Mensal</p>
          <p className="text-2xl font-extrabold">R$ {fixedTotal.toFixed(2)}</p>
          <p className="text-xs opacity-70">{fixedCosts.length} despesas</p>
        </div>
        <div className="bg-warning/20 p-4 rounded-2xl">
          <p className="text-xs font-medium text-warning">Custo Fixo Diário</p>
          <p className="text-2xl font-extrabold text-warning">R$ {dailyFixed.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Baseado em 30 dias</p>
        </div>
      </div>

      {/* Logo + Name */}
      <Card className="card-elevated">
        <CardContent className="py-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors shrink-0">
            <Camera className="w-6 h-6 text-primary/50" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Nome da loja</label>
            <Input placeholder="Ex: Doces da Maria" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Labor config - matching reference */}
      <Card className="card-elevated">
        <CardContent className="p-5 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">👩‍🍳 Configuração de Mão de Obra</h3>
            <p className="text-xs text-muted-foreground">Valores usados automaticamente na precificação</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">Salário Mensal Desejado (R$)</label>
            <Input type="number" placeholder="Ex: 3000" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} className="h-12 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Horas/dia</label>
              <Input type="number" placeholder="8" value={workHours} onChange={(e) => setWorkHours(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-foreground">Dias/semana</label>
              <Input type="number" placeholder="5" value={workDays} onChange={(e) => setWorkDays(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>

          {hourlyRate > 0 && (
            <div className="bg-secondary p-3 rounded-xl text-center">
              <p className="text-xs text-muted-foreground">Valor da sua hora:</p>
              <p className="text-xl font-extrabold text-primary">R$ {hourlyRate.toFixed(2)}</p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-12 btn-3d font-bold gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>

      {/* Fixed costs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">🗂️ Custos Fixos</h3>
          <Button variant="outline" size="sm" onClick={addFixedCost} className="rounded-xl text-primary border-primary/30 font-bold gap-1">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        <Card className="card-elevated">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Nome do custo" value={newFixedName} onChange={(e) => setNewFixedName(e.target.value)} className="h-11 rounded-xl" />
            <div className="flex gap-2">
              <Input type="number" placeholder="Valor (R$)" value={newFixedAmount} onChange={(e) => setNewFixedAmount(e.target.value)} className="h-11 rounded-xl flex-1" />
              <Select value={newFixedFreq} onValueChange={setNewFixedFreq}>
                <SelectTrigger className="h-11 rounded-xl w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{frequencies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {fixedCosts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-1">🗂️</p>
            <p className="text-sm text-muted-foreground">Nenhuma despesa cadastrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fixedCosts.map((cost, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-card border border-border p-3 rounded-xl">
                <span className="text-sm font-medium text-foreground flex-1 truncate">{cost.category}</span>
                <span className="text-xs text-muted-foreground">{cost.frequency}</span>
                <span className="text-sm font-bold text-primary">R$ {cost.amount.toFixed(2)}</span>
                <button onClick={() => removeFixed(idx)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center bg-primary/10 p-3 rounded-xl">
              <span className="text-sm font-bold text-foreground">Total mensal</span>
              <span className="text-lg font-extrabold text-primary">R$ {fixedTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Variable costs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">📊 Custos Variáveis</h3>
          <Button variant="outline" size="sm" onClick={addVariableCost} className="rounded-xl text-primary border-primary/30 font-bold gap-1">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        <Card className="card-elevated">
          <CardContent className="p-4 space-y-3">
            <Input placeholder="Nome do custo" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} className="h-11 rounded-xl" />
            <div className="flex gap-2">
              <Input type="number" placeholder="Valor (R$)" value={newVarAmount} onChange={(e) => setNewVarAmount(e.target.value)} className="h-11 rounded-xl flex-1" />
              <Select value={newVarFreq} onValueChange={setNewVarFreq}>
                <SelectTrigger className="h-11 rounded-xl w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{frequencies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {variableCosts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-1">📊</p>
            <p className="text-sm text-muted-foreground">Nenhum custo variável cadastrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {variableCosts.map((cost, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-card border border-border p-3 rounded-xl">
                <span className="text-sm font-medium text-foreground flex-1 truncate">{cost.category}</span>
                <span className="text-xs text-muted-foreground">{cost.frequency}</span>
                <span className="text-sm font-bold text-accent">R$ {cost.amount.toFixed(2)}</span>
                <button onClick={() => removeVariable(idx)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center bg-accent/10 p-3 rounded-xl">
              <span className="text-sm font-bold text-foreground">Total mensal</span>
              <span className="text-lg font-extrabold text-accent">R$ {variableTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fechamento de Caixa */}
      <Card className="card-elevated border-primary/20">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">📋 Fechamento de Caixa</h3>
          <Button variant="outline" className="w-full rounded-xl h-12 font-bold text-primary border-primary/30">
            Fechar Mês
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessInfo;
