import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Store, Clock, DollarSign, Plus, Pencil, Trash2, Camera, Calculator, TrendingUp } from "lucide-react";

interface CostItem {
  id?: string;
  category: string;
  amount: number;
  isEditing?: boolean;
}

const BusinessInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [workDays, setWorkDays] = useState("");
  const [workHours, setWorkHours] = useState("");

  // Dynamic costs
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([]);
  const [newFixedName, setNewFixedName] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");
  const [newVarName, setNewVarName] = useState("");
  const [newVarAmount, setNewVarAmount] = useState("");

  const hourlyRate =
    Number(desiredSalary) > 0 && Number(workDays) > 0 && Number(workHours) > 0
      ? Number(desiredSalary) / (Number(workDays) * 4.33 * Number(workHours))
      : 0;

  const fixedTotal = fixedCosts.reduce((s, c) => s + c.amount, 0);
  const variableTotal = variableCosts.reduce((s, c) => s + c.amount, 0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile) {
        setStoreName(profile.store_name || "");
        setWhatsapp(profile.whatsapp || "");
        setAddress(profile.address || "");
        if (profile.desired_salary) setDesiredSalary(String(profile.desired_salary));
        if (profile.work_days_per_week) setWorkDays(String(profile.work_days_per_week));
        if (profile.work_hours_per_day) setWorkHours(String(profile.work_hours_per_day));
      }
      const { data: fc } = await supabase.from("fixed_costs").select("*").eq("user_id", user.id);
      setFixedCosts(fc?.map((c) => ({ id: c.id, category: c.category, amount: Number(c.amount) })) || []);
      const { data: vc } = await supabase.from("variable_costs").select("*").eq("user_id", user.id);
      setVariableCosts(vc?.map((c) => ({ id: c.id, category: c.category, amount: Number(c.amount) })) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const addFixedCost = () => {
    if (!newFixedName.trim() || !newFixedAmount) return;
    setFixedCosts([...fixedCosts, { category: newFixedName.trim(), amount: Number(newFixedAmount) }]);
    setNewFixedName("");
    setNewFixedAmount("");
  };

  const addVariableCost = () => {
    if (!newVarName.trim() || !newVarAmount) return;
    setVariableCosts([...variableCosts, { category: newVarName.trim(), amount: Number(newVarAmount) }]);
    setNewVarName("");
    setNewVarAmount("");
  };

  const removeFixed = (idx: number) => setFixedCosts(fixedCosts.filter((_, i) => i !== idx));
  const removeVariable = (idx: number) => setVariableCosts(variableCosts.filter((_, i) => i !== idx));

  const updateFixed = (idx: number, field: "category" | "amount", value: string) => {
    const updated = [...fixedCosts];
    if (field === "amount") updated[idx].amount = Number(value);
    else updated[idx].category = value;
    setFixedCosts(updated);
  };

  const updateVariable = (idx: number, field: "category" | "amount", value: string) => {
    const updated = [...variableCosts];
    if (field === "amount") updated[idx].amount = Number(value);
    else updated[idx].category = value;
    setVariableCosts(updated);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        store_name: storeName,
        whatsapp,
        address,
        desired_salary: Number(desiredSalary) || 0,
        work_days_per_week: Number(workDays) || 5,
        work_hours_per_day: Number(workHours) || 8,
      }).eq("user_id", user.id);

      // Delete all and re-insert fixed costs
      await supabase.from("fixed_costs").delete().eq("user_id", user.id);
      if (fixedCosts.length > 0) {
        await supabase.from("fixed_costs").insert(
          fixedCosts.map((c) => ({ user_id: user.id, category: c.category, amount: c.amount }))
        );
      }

      // Delete all and re-insert variable costs
      await supabase.from("variable_costs").delete().eq("user_id", user.id);
      if (variableCosts.length > 0) {
        await supabase.from("variable_costs").insert(
          variableCosts.map((c) => ({ user_id: user.id, category: c.category, amount: c.amount }))
        );
      }

      toast({ title: "Informações salvas com sucesso! ✅" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Informações do Negócio</h1>
        <p className="text-sm text-muted-foreground">Configure aqui os dados da sua loja para usar em todo o app 💖</p>
      </div>

      {/* Logo upload placeholder */}
      <Card className="card-elevated">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Camera className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Adicione a logo da sua loja</p>
          </div>
        </CardContent>
      </Card>

      {/* Store data */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Dados da sua loja
          </CardTitle>
          <p className="text-xs text-muted-foreground">Preencha as informações básicas do seu negócio</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Nome da loja</label>
            <Input placeholder="Ex: Doces da Maria" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">WhatsApp</label>
            <Input placeholder="(11) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Endereço</label>
            <Input placeholder="Rua, número, cidade" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>

      {/* Hourly rate */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" />
            Descubra o valor da sua hora trabalhada
          </CardTitle>
          <p className="text-xs text-muted-foreground">Esse valor será usado automaticamente na precificação dos seus produtos</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Qual o salário que você deseja receber por mês?</label>
            <Input type="number" placeholder="Ex: 3000" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Dias por semana que você trabalha?</label>
              <Input type="number" placeholder="Ex: 5" value={workDays} onChange={(e) => setWorkDays(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Horas por dia que você trabalha?</label>
              <Input type="number" placeholder="Ex: 8" value={workHours} onChange={(e) => setWorkHours(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>
          {hourlyRate > 0 && (
            <div className="bg-gradient-to-r from-secondary to-pink-light p-4 rounded-xl border border-primary/10">
              <p className="text-xs text-muted-foreground font-semibold">💡 O valor da sua hora trabalhada é:</p>
              <p className="text-2xl font-extrabold text-primary">R$ {hourlyRate.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Na precificação, basta informar o tempo de produção e o sistema calcula automaticamente.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fixed costs */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Custos fixos mensais
          </CardTitle>
          <p className="text-xs text-muted-foreground">Adicione seus gastos fixos do mês (aluguel, luz, internet...)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Nome do custo" value={newFixedName} onChange={(e) => setNewFixedName(e.target.value)} className="h-11 rounded-xl flex-1" />
            <Input type="number" placeholder="Valor" value={newFixedAmount} onChange={(e) => setNewFixedAmount(e.target.value)} className="h-11 rounded-xl w-28" />
            <Button onClick={addFixedCost} size="icon" className="h-11 w-11 rounded-xl shrink-0 btn-3d">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {fixedCosts.length > 0 && (
            <div className="space-y-2">
              {fixedCosts.map((cost, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-secondary/40 p-2.5 rounded-xl">
                  <Input value={cost.category} onChange={(e) => updateFixed(idx, "category", e.target.value)} className="h-9 rounded-lg flex-1 text-sm" />
                  <Input type="number" value={cost.amount} onChange={(e) => updateFixed(idx, "amount", e.target.value)} className="h-9 rounded-lg w-24 text-sm" />
                  <button onClick={() => removeFixed(idx)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center bg-primary/10 p-3 rounded-xl">
                <span className="text-sm font-bold text-foreground">Total custos fixos</span>
                <span className="text-lg font-extrabold text-primary">R$ {fixedTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variable costs */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Custos variáveis
          </CardTitle>
          <p className="text-xs text-muted-foreground">Gastos que mudam de mês a mês (combustível, entregas, taxas...)</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Nome do custo" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} className="h-11 rounded-xl flex-1" />
            <Input type="number" placeholder="Valor" value={newVarAmount} onChange={(e) => setNewVarAmount(e.target.value)} className="h-11 rounded-xl w-28" />
            <Button onClick={addVariableCost} size="icon" className="h-11 w-11 rounded-xl shrink-0 btn-3d-gold bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {variableCosts.length > 0 && (
            <div className="space-y-2">
              {variableCosts.map((cost, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-secondary/40 p-2.5 rounded-xl">
                  <Input value={cost.category} onChange={(e) => updateVariable(idx, "category", e.target.value)} className="h-9 rounded-lg flex-1 text-sm" />
                  <Input type="number" value={cost.amount} onChange={(e) => updateVariable(idx, "amount", e.target.value)} className="h-9 rounded-lg w-24 text-sm" />
                  <button onClick={() => removeVariable(idx)} className="text-destructive hover:text-destructive/80 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between items-center bg-accent/10 p-3 rounded-xl">
                <span className="text-sm font-bold text-foreground">Total custos variáveis</span>
                <span className="text-lg font-extrabold text-accent">R$ {variableTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-14 text-lg font-bold btn-3d">
        {saving ? "Salvando..." : "💾 Salvar informações"}
      </Button>
    </div>
  );
};

export default BusinessInfo;
