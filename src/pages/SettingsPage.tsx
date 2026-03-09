import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, CheckCircle2, Building2, Target, Pencil } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CostItem {
  id?: string;
  category: string;
  amount: number;
  frequency: string;
}

const frequencies = [
  { value: "mensal", label: "Mensal" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "anual", label: "Anual" },
];

const fixedCostCategories = ["Aluguel", "Luz", "Água", "Gás", "Internet", "Telefone", "Contador", "Outros"];
const variableCostCategories = ["Ingredientes", "Embalagens", "Entregador", "Uber/99", "Aplicativos", "Marketing", "Outros"];

const SettingsPage = () => {
  const { user, profile, refreshProfile, businessId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Labor
  const [desiredSalary, setDesiredSalary] = useState("");
  const [workDays, setWorkDays] = useState("");
  const [workHours, setWorkHours] = useState("");

  // Costs
  const [fixedCosts, setFixedCosts] = useState<CostItem[]>([]);
  const [variableCosts, setVariableCosts] = useState<CostItem[]>([]);
  const [newFixedName, setNewFixedName] = useState("");
  const [newFixedCategory, setNewFixedCategory] = useState("");
  const [newFixedCustomName, setNewFixedCustomName] = useState("");
  const [newFixedAmount, setNewFixedAmount] = useState("");
  const [newFixedFreq, setNewFixedFreq] = useState("mensal");
  const [newVarName, setNewVarName] = useState("");
  const [newVarCategory, setNewVarCategory] = useState("");
  const [newVarCustomName, setNewVarCustomName] = useState("");
  const [newVarAmount, setNewVarAmount] = useState("");
  const [newVarFreq, setNewVarFreq] = useState("mensal");

  // Settings extras
  const [defaultCardFee, setDefaultCardFee] = useState("");
  const [revenueGoal, setRevenueGoal] = useState("");

  // Edit cost state
  const [editingFixedIdx, setEditingFixedIdx] = useState<number | null>(null);
  const [editingVarIdx, setEditingVarIdx] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

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

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (p) {
        setName(p.name || "");
        setStoreName(p.store_name || "");
        setAddress(p.address || "");
        setWhatsapp(p.whatsapp || "");
        setLogoUrl(p.logo_url || "");
      }
      const { data: fc } = await supabase.from("fixed_costs").select("*").eq("business_id", businessId);
      setFixedCosts(fc?.map((c) => ({ id: c.id, category: c.category, amount: Number(c.amount), frequency: "mensal" })) || []);
      const { data: vc } = await supabase.from("variable_costs").select("*").eq("business_id", businessId);
      setVariableCosts(vc?.map((c) => ({ id: c.id, category: c.category, amount: Number(c.amount), frequency: "mensal" })) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
    setLogoUrl(publicUrl);
    await supabase.from("profiles").update({ logo_url: publicUrl }).eq("user_id", user.id);
    toast({ title: "Logo atualizada! ✅" });
  };

  const addFixedCost = () => {
    const costName = newFixedCategory === "Outros" && newFixedCustomName.trim() ? newFixedCustomName.trim() : newFixedCategory;
    if (!costName || !newFixedAmount) return;
    setFixedCosts([...fixedCosts, { category: costName, amount: Number(newFixedAmount), frequency: newFixedFreq }]);
    setNewFixedCategory(""); setNewFixedCustomName(""); setNewFixedAmount(""); setNewFixedFreq("mensal");
  };

  const addVariableCost = () => {
    const costName = newVarCategory === "Outros" && newVarCustomName.trim() ? newVarCustomName.trim() : newVarCategory;
    if (!costName || !newVarAmount) return;
    setVariableCosts([...variableCosts, { category: costName, amount: Number(newVarAmount), frequency: newVarFreq }]);
    setNewVarCategory(""); setNewVarCustomName(""); setNewVarAmount(""); setNewVarFreq("mensal");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        name, store_name: storeName, address, whatsapp,
        desired_salary: Number(desiredSalary) || 0,
        work_days_per_week: Number(workDays) || 0,
        work_hours_per_day: Number(workHours) || 0,
      }).eq("user_id", user.id);

      await supabase.from("fixed_costs").delete().eq("business_id", businessId);
      if (fixedCosts.length > 0) {
        await supabase.from("fixed_costs").insert(fixedCosts.map((c) => ({ user_id: user.id, business_id: businessId, category: c.category, amount: toMonthly(c.amount, c.frequency) } as any)));
      }

      await supabase.from("variable_costs").delete().eq("user_id", user.id);
      if (variableCosts.length > 0) {
        await supabase.from("variable_costs").insert(variableCosts.map((c) => ({ user_id: user.id, business_id: businessId, category: c.category, amount: toMonthly(c.amount, c.frequency) } as any)));
      }

      await refreshProfile();
      toast({ title: "Configurações salvas! ✅" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Informações da Empresa</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full h-12 rounded-xl">
          <TabsTrigger value="profile" className="rounded-xl font-bold text-xs">Perfil</TabsTrigger>
          <TabsTrigger value="financial" className="rounded-xl font-bold text-xs">Financeiro</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card className="card-elevated">
            <CardContent className="py-5 flex flex-col items-center gap-3">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <Camera className="w-8 h-8 text-primary/50" />
                  </div>
                )}
              </label>
              <p className="text-xs text-muted-foreground">Toque para adicionar sua foto/logo</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-5 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Seu nome</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Nome da loja</label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ex: Doces da Maria" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">WhatsApp</label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Endereço (usado para retirada de encomendas)</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" className="h-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCIAL TAB */}
        <TabsContent value="financial" className="space-y-5 mt-4">
          {/* Labor */}
          <Card className="card-elevated">
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">👩‍🍳 Descubra o valor da sua Hora Trabalhada</h3>
                <p className="text-xs text-muted-foreground">Esse valor será usado automaticamente na precificação</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Qual é o salário mensal desejado?</label>
                <CurrencyInput placeholder="R$" value={desiredSalary} onValueChange={setDesiredSalary} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Quantas horas por dia você trabalha?</label>
                <Input type="number" placeholder="Ex: 8" value={workHours} onChange={(e) => setWorkHours(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Quantos dias por semana você trabalha?</label>
                <Input type="number" placeholder="Ex: 5" value={workDays} onChange={(e) => setWorkDays(e.target.value)} className="h-12 rounded-xl" />
              </div>

              {hourlyRate > 0 && (
                <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground">Com base nas suas respostas, o valor da sua hora é:</p>
                  <p className="text-2xl font-extrabold text-success">R$ {hourlyRate.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fixed costs */}
          <Card className="card-elevated">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-base font-extrabold text-foreground">🗂️ Custos Fixos</h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {fixedCostCategories.map(c => (
                    <button key={c} onClick={() => setNewFixedCategory(c)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${newFixedCategory === c ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {newFixedCategory === "Outros" && (
                  <Input placeholder="Especifique o custo..." value={newFixedCustomName} onChange={(e) => setNewFixedCustomName(e.target.value)} className="h-11 rounded-xl" />
                )}
                <div className="flex gap-2">
                  <CurrencyInput placeholder="Valor (R$)" value={newFixedAmount} onValueChange={setNewFixedAmount} className="h-11 rounded-xl flex-1" />
                  <Select value={newFixedFreq} onValueChange={setNewFixedFreq}>
                    <SelectTrigger className="h-11 rounded-xl w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{frequencies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {newFixedCategory && newFixedAmount && (
                  <Button onClick={addFixedCost} className="w-full rounded-xl h-11 font-bold bg-success hover:bg-success/90 text-success-foreground">
                    Adicionar
                  </Button>
                )}
              </div>

              {fixedCosts.length > 0 && (
                <div className="space-y-2">
                  {fixedCosts.map((cost, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                      {editingFixedIdx === idx ? (
                        <>
                          <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} className="h-9 rounded-lg flex-1 text-sm" />
                          <CurrencyInput value={editAmount} onValueChange={setEditAmount} className="h-9 rounded-lg w-28 text-sm" />
                          <button onClick={() => {
                            const updated = [...fixedCosts];
                            updated[idx] = { ...updated[idx], category: editCategory, amount: Number(editAmount) };
                            setFixedCosts(updated);
                            setEditingFixedIdx(null);
                          }} className="text-success p-1"><CheckCircle2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-foreground flex-1 truncate">{cost.category}</span>
                          <span className="text-xs text-muted-foreground">{cost.frequency}</span>
                          <span className="text-sm font-bold text-primary">R$ {cost.amount.toFixed(2)}</span>
                          <button onClick={() => { setEditingFixedIdx(idx); setEditCategory(cost.category); setEditAmount(String(cost.amount)); }} className="text-primary p-1"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setFixedCosts(fixedCosts.filter((_, i) => i !== idx))} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-success p-3 rounded-xl">
                    <span className="text-sm font-bold text-success-foreground">Total mensal</span>
                    <span className="text-lg font-extrabold text-success-foreground">R$ {fixedTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variable costs */}
          <Card className="card-elevated">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-base font-extrabold text-foreground">📊 Custos Variáveis</h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {variableCostCategories.map(c => (
                    <button key={c} onClick={() => setNewVarCategory(c)}
                      className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${newVarCategory === c ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                      {c}
                    </button>
                  ))}
                </div>
                {newVarCategory === "Outros" && (
                  <Input placeholder="Especifique o custo..." value={newVarCustomName} onChange={(e) => setNewVarCustomName(e.target.value)} className="h-11 rounded-xl" />
                )}
                <div className="flex gap-2">
                  <CurrencyInput placeholder="Valor (R$)" value={newVarAmount} onValueChange={setNewVarAmount} className="h-11 rounded-xl flex-1" />
                  <Select value={newVarFreq} onValueChange={setNewVarFreq}>
                    <SelectTrigger className="h-11 rounded-xl w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{frequencies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {newVarCategory && newVarAmount && (
                  <Button onClick={addVariableCost} className="w-full rounded-xl h-11 font-bold bg-success hover:bg-success/90 text-success-foreground">
                    Adicionar
                  </Button>
                )}
              </div>

              {variableCosts.length > 0 && (
                <div className="space-y-2">
                  {variableCosts.map((cost, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                      {editingVarIdx === idx ? (
                        <>
                          <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} className="h-9 rounded-lg flex-1 text-sm" />
                          <CurrencyInput value={editAmount} onValueChange={setEditAmount} className="h-9 rounded-lg w-28 text-sm" />
                          <button onClick={() => {
                            const updated = [...variableCosts];
                            updated[idx] = { ...updated[idx], category: editCategory, amount: Number(editAmount) };
                            setVariableCosts(updated);
                            setEditingVarIdx(null);
                          }} className="text-success p-1"><CheckCircle2 className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-foreground flex-1 truncate">{cost.category}</span>
                          <span className="text-xs text-muted-foreground">{cost.frequency}</span>
                          <span className="text-sm font-bold text-primary">R$ {cost.amount.toFixed(2)}</span>
                          <button onClick={() => { setEditingVarIdx(idx); setEditCategory(cost.category); setEditAmount(String(cost.amount)); }} className="text-primary p-1"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setVariableCosts(variableCosts.filter((_, i) => i !== idx))} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-success p-3 rounded-xl">
                    <span className="text-sm font-bold text-success-foreground">Total mensal</span>
                    <span className="text-lg font-extrabold text-success-foreground">R$ {variableTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial settings */}
          <Card className="card-elevated">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2"><Target className="w-4 h-4" /> Configurações financeiras</h3>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Meta de faturamento mensal (R$)</label>
                <CurrencyInput placeholder="Ex: 5000" value={revenueGoal} onValueChange={setRevenueGoal} className="h-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-14 btn-3d font-bold text-base gap-2">
        <CheckCircle2 className="w-5 h-5" /> {saving ? "Salvando..." : "Salvar Informações"}
      </Button>
    </div>
  );
};

export default SettingsPage;