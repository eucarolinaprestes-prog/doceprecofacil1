import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Trash2, Lightbulb, Upload, CheckCircle2, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const stepLabels = ["Produto", "Ingredientes", "Mão de Obra", "Estratégia", "Salvar"];
const categories = ["Massa", "Recheio", "Bolo", "Fatias", "Cupcakes", "Salgados", "Doces"];
const saleTypes = [
  { value: "unidade(s)", label: "unidade(s)" },
  { value: "fatia(s)", label: "fatia(s)" },
  { value: "porção(ões)", label: "porção(ões)" },
  { value: "kg", label: "kg" },
];

interface StockItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_purchased: number; total_cost: number; }
interface SelectedItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_used: number; isManual?: boolean; }

const CHART_COLORS = ["hsl(340, 75%, 55%)", "hsl(40, 80%, 55%)", "hsl(320, 60%, 65%)"];

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 - Product
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [category, setCategory] = useState("");
  const [saleType, setSaleType] = useState("");
  const [yieldQty, setYieldQty] = useState("");

  // Step 2 - Ingredients & Packaging
  const [stockIngredients, setStockIngredients] = useState<StockItem[]>([]);
  const [stockPackaging, setStockPackaging] = useState<StockItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedItem[]>([]);
  const [selectedPackaging, setSelectedPackaging] = useState<SelectedItem[]>([]);
  const [showIngManual, setShowIngManual] = useState(false);
  const [showPkgManual, setShowPkgManual] = useState(false);
  const [manualIng, setManualIng] = useState({ name: "", qty: "", unit: "g", cost: "" });
  const [manualPkg, setManualPkg] = useState({ name: "", qty: "", unit: "un", cost: "" });

  // Step 3 - Labor & Fixed Costs
  const [hourlyRate, setHourlyRate] = useState(0);
  const [salaryConfigured, setSalaryConfigured] = useState(false);
  const [prepTime, setPrepTime] = useState("");
  const [fixedCostPercent, setFixedCostPercent] = useState([15]);
  const [totalFixedCosts, setTotalFixedCosts] = useState(0);

  // Step 4 - Strategy
  const [profitMargin, setProfitMargin] = useState([30]);
  const [ifoodEnabled, setIfoodEnabled] = useState(false);
  const [ifoodFee, setIfoodFee] = useState("12");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cardFee, setCardFee] = useState("3");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile }, { data: ing }, { data: pkg }, { data: fc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("ingredients").select("*").eq("user_id", user.id).order("name"),
        supabase.from("packaging").select("*").eq("user_id", user.id).order("name"),
        supabase.from("fixed_costs").select("*").eq("user_id", user.id),
      ]);
      if (profile) {
        const salary = Number(profile.desired_salary) || 0;
        const days = Number(profile.work_days_per_week) || 5;
        const hours = Number(profile.work_hours_per_day) || 8;
        if (salary > 0) {
          setHourlyRate(salary / (days * 4.33 * hours));
          setSalaryConfigured(true);
        }
      }
      setStockIngredients(ing?.map((i: any) => ({ id: i.id, name: i.name, unit: i.unit, cost_per_unit: Number(i.cost_per_unit) || 0, quantity_purchased: i.quantity_purchased, total_cost: i.total_cost })) || []);
      setStockPackaging(pkg?.map((p: any) => ({ id: p.id, name: p.name, unit: p.unit, cost_per_unit: Number(p.cost_per_unit) || 0, quantity_purchased: p.quantity_purchased, total_cost: p.total_cost })) || []);
      setTotalFixedCosts(fc?.reduce((s: number, c: any) => s + Number(c.amount), 0) || 0);
    };
    load();
  }, [user]);

  const addFromStock = (item: StockItem, type: "ingredient" | "packaging") => {
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    if (list.find(i => i.id === item.id)) return;
    const newItem = { id: item.id, name: item.name, unit: item.unit, cost_per_unit: item.cost_per_unit, quantity_used: 0 };
    type === "ingredient" ? setSelectedIngredients([...list, newItem]) : setSelectedPackaging([...list, newItem]);
  };

  const addManualIngredient = () => {
    if (!manualIng.name.trim() || !manualIng.cost) return;
    const newItem: SelectedItem = {
      id: `manual-${Date.now()}`, name: manualIng.name, unit: manualIng.unit,
      cost_per_unit: Number(manualIng.cost) / (Number(manualIng.qty) || 1),
      quantity_used: Number(manualIng.qty) || 1, isManual: true,
    };
    setSelectedIngredients([...selectedIngredients, newItem]);
    setManualIng({ name: "", qty: "", unit: "g", cost: "" });
    setShowIngManual(false);
  };

  const addManualPackaging = () => {
    if (!manualPkg.name.trim() || !manualPkg.cost) return;
    const newItem: SelectedItem = {
      id: `manual-${Date.now()}`, name: manualPkg.name, unit: manualPkg.unit,
      cost_per_unit: Number(manualPkg.cost) / (Number(manualPkg.qty) || 1),
      quantity_used: Number(manualPkg.qty) || 1, isManual: true,
    };
    setSelectedPackaging([...selectedPackaging, newItem]);
    setManualPkg({ name: "", qty: "", unit: "un", cost: "" });
    setShowPkgManual(false);
  };

  const updateSelectedQty = (id: string, qty: number, type: "ingredient" | "packaging") => {
    const setter = type === "ingredient" ? setSelectedIngredients : setSelectedPackaging;
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    setter(list.map(i => i.id === id ? { ...i, quantity_used: qty } : i));
  };

  const removeSelected = (id: string, type: "ingredient" | "packaging") => {
    const setter = type === "ingredient" ? setSelectedIngredients : setSelectedPackaging;
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    setter(list.filter(i => i.id !== id));
  };

  // Calculations
  const ingredientsCost = selectedIngredients.reduce((s, i) => s + i.cost_per_unit * i.quantity_used, 0);
  const packagingCost = selectedPackaging.reduce((s, i) => s + i.cost_per_unit * i.quantity_used, 0);
  const laborCost = hourlyRate * (Number(prepTime) || 0) / 60;
  const fixedCostValue = totalFixedCosts * (fixedCostPercent[0] / 100);
  const baseCost = ingredientsCost + packagingCost + laborCost + fixedCostValue;
  const profitValue = baseCost * (profitMargin[0] / 100);
  let suggestedPrice = baseCost + profitValue;
  const deliveryValue = deliveryEnabled ? Number(deliveryFee) || 0 : 0;
  suggestedPrice += deliveryValue;
  if (ifoodEnabled) suggestedPrice = suggestedPrice / (1 - Number(ifoodFee) / 100);
  if (cardEnabled) suggestedPrice = suggestedPrice / (1 - Number(cardFee) / 100);
  const finalProfit = suggestedPrice - baseCost - deliveryValue;
  const pricePerUnit = Number(yieldQty) > 1 ? suggestedPrice / Number(yieldQty) : suggestedPrice;

  const chartData = [
    { name: "Ingredientes", value: ingredientsCost + packagingCost },
    { name: "Custos Fixos", value: fixedCostValue + laborCost },
    { name: "Lucro", value: Math.max(0, finalProfit) },
  ].filter(d => d.value > 0);

  const canAdvance = () => {
    if (step === 0) return productName.trim() && category && saleType && yieldQty;
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("products").insert({
        user_id: user.id, name: productName, description: productDesc, category,
        yield_quantity: Number(yieldQty) || 1, yield_unit: saleType,
        preparation_time: Number(prepTime) || 0, total_cost: baseCost,
        suggested_price: suggestedPrice, profit_margin: profitMargin[0],
        ingredients_json: selectedIngredients as any, packaging_json: selectedPackaging as any,
      });
      if (error) throw error;
      toast({ title: "Produto salvo com sucesso! 🎉" });
      setStep(0); setProductName(""); setProductDesc(""); setCategory(""); setSaleType("");
      setYieldQty(""); setSelectedIngredients([]); setSelectedPackaging([]); setPrepTime("");
      setProfitMargin([30]); setFixedCostPercent([15]);
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const goNext = () => { if (canAdvance()) setStep(step + 1); };
  const goBack = () => setStep(Math.max(0, step - 1));

  return (
    <div className="space-y-5 pb-6">
      {/* Back + Progress */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button onClick={goBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex gap-1.5">
            {stepLabels.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted"
              }`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {stepLabels[step]} • Etapa {step + 1} de {stepLabels.length}
          </p>
        </div>
      </div>

      {/* STEP 0: Product */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">O que você quer precificar?</h2>
            <p className="text-sm text-muted-foreground">Informe os detalhes do produto</p>
          </div>

          {/* Photo upload */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
              <Upload className="w-7 h-7 text-primary/50" />
              <span className="text-xs text-primary/60 font-medium">Foto</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Nome do Produto *</label>
            <Input placeholder="Ex: Bolo de Chocolate" value={productName} onChange={(e) => setProductName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-border" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Descrição (opcional)</label>
            <Input placeholder="Descrição curta do produto" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-border" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Categoria</label>
            <Input placeholder="Ex: Bolos, Doces, Salgados" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-border" list="categories-list" />
            <datalist id="categories-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Rendimento *</label>
            <div className="flex gap-3">
              <Input type="number" placeholder="Ex: 12" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-border flex-1" />
              <Select value={saleType} onValueChange={setSaleType}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border w-40">
                  <SelectValue placeholder="unidade(s)" />
                </SelectTrigger>
                <SelectContent>
                  {saleTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Ingredients & Packaging */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Ingredientes & Embalagens</h2>
            <p className="text-sm text-muted-foreground">Adicione os insumos utilizados na receita</p>
          </div>

          {/* Ingredients section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">🥄 Ingredientes</h3>
              <div className="flex gap-2">
                <Select onValueChange={(id) => { const item = stockIngredients.find(i => i.id === id); if (item) addFromStock(item, "ingredient"); }}>
                  <SelectTrigger className="h-9 rounded-full bg-secondary text-primary text-xs font-bold border-0 px-4 w-auto">
                    <span>+ Do Estoque</span>
                  </SelectTrigger>
                  <SelectContent>
                    {stockIngredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (R$ {i.cost_per_unit.toFixed(4)}/{i.unit})</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => setShowIngManual(!showIngManual)} className="h-9 rounded-full bg-muted text-muted-foreground text-xs font-bold px-4 hover:bg-muted/80 transition-colors">
                  + Avulso
                </button>
              </div>
            </div>

            {showIngManual && (
              <Card className="border border-border">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">Ingrediente Avulso</p>
                  <Input placeholder="Nome" value={manualIng.name} onChange={(e) => setManualIng({ ...manualIng, name: e.target.value })} className="h-11 rounded-xl bg-muted/50" />
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Qtd" value={manualIng.qty} onChange={(e) => setManualIng({ ...manualIng, qty: e.target.value })} className="h-11 rounded-xl bg-muted/50 flex-1" />
                    <Select value={manualIng.unit} onValueChange={(v) => setManualIng({ ...manualIng, unit: v })}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/50 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["g", "ml", "kg", "l"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="R$" value={manualIng.cost} onChange={(e) => setManualIng({ ...manualIng, cost: e.target.value })} className="h-11 rounded-xl bg-muted/50 flex-1" />
                  </div>
                  <Button onClick={addManualIngredient} className="w-full rounded-xl h-10 bg-primary text-primary-foreground font-bold">
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedIngredients.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                <span className="text-sm font-medium text-foreground flex-1 truncate">{item.name}</span>
                <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "ingredient")} className="w-16 h-9 rounded-lg text-sm text-center bg-background" />
                <span className="text-xs text-muted-foreground">{item.unit}</span>
                <span className="text-xs font-bold text-primary min-w-[60px] text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                <button onClick={() => removeSelected(item.id, "ingredient")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Packaging section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">📦 Embalagens</h3>
              <div className="flex gap-2">
                <Select onValueChange={(id) => { const item = stockPackaging.find(i => i.id === id); if (item) addFromStock(item, "packaging"); }}>
                  <SelectTrigger className="h-9 rounded-full bg-secondary text-primary text-xs font-bold border-0 px-4 w-auto">
                    <span>+ Do Estoque</span>
                  </SelectTrigger>
                  <SelectContent>
                    {stockPackaging.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (R$ {i.cost_per_unit.toFixed(4)}/{i.unit})</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => setShowPkgManual(!showPkgManual)} className="h-9 rounded-full bg-muted text-muted-foreground text-xs font-bold px-4 hover:bg-muted/80 transition-colors">
                  + Avulso
                </button>
              </div>
            </div>

            {showPkgManual && (
              <Card className="border border-border">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground">Embalagem Avulsa</p>
                  <Input placeholder="Nome" value={manualPkg.name} onChange={(e) => setManualPkg({ ...manualPkg, name: e.target.value })} className="h-11 rounded-xl bg-muted/50" />
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Qtd" value={manualPkg.qty} onChange={(e) => setManualPkg({ ...manualPkg, qty: e.target.value })} className="h-11 rounded-xl bg-muted/50 flex-1" />
                    <Select value={manualPkg.unit} onValueChange={(v) => setManualPkg({ ...manualPkg, unit: v })}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/50 w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["un", "pacote", "caixa"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="R$" value={manualPkg.cost} onChange={(e) => setManualPkg({ ...manualPkg, cost: e.target.value })} className="h-11 rounded-xl bg-muted/50 flex-1" />
                  </div>
                  <Button onClick={addManualPackaging} className="w-full rounded-xl h-10 bg-primary text-primary-foreground font-bold">
                    Adicionar
                  </Button>
                </CardContent>
              </Card>
            )}

            {selectedPackaging.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                <span className="text-sm font-medium text-foreground flex-1 truncate">{item.name}</span>
                <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "packaging")} className="w-16 h-9 rounded-lg text-sm text-center bg-background" />
                <span className="text-xs text-muted-foreground">{item.unit}</span>
                <span className="text-xs font-bold text-primary min-w-[60px] text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                <button onClick={() => removeSelected(item.id, "packaging")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-secondary p-4 rounded-xl flex justify-between items-center">
            <span className="font-bold text-foreground">Custo total dos insumos</span>
            <span className="text-xl font-extrabold text-primary">R$ {(ingredientsCost + packagingCost).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* STEP 2: Labor & Fixed Costs */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Mão de Obra & Custos Fixos</h2>
            <p className="text-sm text-muted-foreground">Calculado automaticamente com base no Financeiro</p>
          </div>

          {/* Salary config status */}
          <div className={`p-4 rounded-xl ${salaryConfigured ? "bg-secondary" : "bg-secondary border border-warning/30"}`}>
            <p className="text-sm font-bold text-primary">Configuração atual (do Financeiro)</p>
            {salaryConfigured ? (
              <p className="text-xs text-muted-foreground mt-1">✅ Valor da sua hora: <strong className="text-foreground">R$ {hourlyRate.toFixed(2)}</strong></p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">⚠️ Configure seu salário no Financeiro para cálculo automático</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Tempo gasto nesta receita (minutos)</label>
            <Input type="number" placeholder="Ex: 90" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-border" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-foreground">% Custos Fixos alocados a este produto</label>
              <Info className="w-4 h-4 text-muted-foreground" />
            </div>
            <Slider value={fixedCostPercent} onValueChange={setFixedCostPercent} min={0} max={50} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-primary font-bold">{fixedCostPercent[0]}% = R$ {fixedCostValue.toFixed(2)}</span>
              <span>50%</span>
            </div>
          </div>

          {/* Cost summary */}
          <div className="bg-secondary p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingredientes</span>
              <span className="font-bold text-foreground">R$ {ingredientsCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Embalagem</span>
              <span className="font-bold text-foreground">R$ {packagingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mão de Obra</span>
              <span className="font-bold text-foreground">R$ {laborCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custos Fixos</span>
              <span className="font-bold text-foreground">R$ {fixedCostValue.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold text-foreground">Custo Total</span>
              <span className="text-xl font-extrabold text-primary">R$ {baseCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Strategy */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Estratégia de Preço</h2>
            <p className="text-sm text-muted-foreground">Defina sua margem e custos adicionais</p>
          </div>

          {/* Profit cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Lucro (R$)</p>
              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">R$ {profitValue.toFixed(2)}</p>
              <p className="text-xs text-emerald-500">R$ {(profitValue / (Number(yieldQty) || 1)).toFixed(2)}/{saleType || "un"}</p>
            </div>
            <div className="bg-primary p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-primary-foreground/80">Margem</p>
              <p className="text-3xl font-extrabold text-primary-foreground">{profitMargin[0]}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Margem de Lucro: <span className="text-primary font-bold">{profitMargin[0]}%</span></p>
            <Slider value={profitMargin} onValueChange={setProfitMargin} min={0} max={200} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-primary font-bold">Sugerido: 30–50%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Optional costs */}
          <Card className="border border-border">
            <CardContent className="p-4 space-y-3">
              <p className="font-bold text-foreground text-sm">Custos Adicionais (opcional)</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">iFood / Uber Eats</span>
                <Switch checked={ifoodEnabled} onCheckedChange={setIfoodEnabled} />
              </div>
              {ifoodEnabled && (
                <div className="flex items-center gap-2 pl-4">
                  <Input type="number" value={ifoodFee} onChange={(e) => setIfoodFee(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Delivery próprio</span>
                <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
              </div>
              {deliveryEnabled && (
                <div className="flex items-center gap-2 pl-4">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-24 h-9 rounded-lg text-sm text-center" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Maquininha (cartão)</span>
                <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
              </div>
              {cardEnabled && (
                <div className="flex items-center gap-2 pl-4">
                  <Input type="number" value={cardFee} onChange={(e) => setCardFee(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Final price highlight */}
          <div className="bg-gradient-to-br from-primary to-primary/80 p-6 rounded-2xl text-center">
            <p className="text-sm text-primary-foreground/80 font-medium">Preço Final de Venda</p>
            <p className="text-4xl font-extrabold text-primary-foreground mt-1">R$ {suggestedPrice.toFixed(2)}</p>
            <p className="text-sm text-primary-foreground/70 mt-1">R$ {pricePerUnit.toFixed(2)} por {saleType || "unidade"}</p>
          </div>

          {/* Price composition chart */}
          {chartData.length > 0 && (
            <Card className="border border-border">
              <CardContent className="p-4">
                <p className="text-sm font-bold text-foreground text-center mb-3">Composição do preço</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {chartData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-bold text-foreground">R$ {d.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial tip */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl">
            <p className="text-sm font-bold text-foreground flex items-center gap-2">💡 Sugestão para o seu Negócio</p>
            <p className="text-xs text-muted-foreground mt-1 mb-2">Como dividir o valor da venda</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Valor da Venda</span><span className="font-bold text-foreground">R$ {suggestedPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Empresa (custos)</span><span className="font-bold text-foreground">R$ {baseCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pró-labore</span><span className="font-bold text-foreground">R$ {laborCost.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-amber-200 dark:border-amber-700 pt-1 mt-1">
                <span className="font-bold text-foreground">Lucro da Empresa</span>
                <span className="font-extrabold text-primary">R$ {Math.max(0, finalProfit - laborCost).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Save / Summary */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-3xl">🍰</p>
            <h2 className="text-xl font-extrabold text-foreground mt-2">Resumo do Produto</h2>
            <p className="text-sm text-muted-foreground">Verifique os dados antes de salvar</p>
          </div>

          <Card className="border border-border">
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Produto</span>
                <span className="font-bold text-foreground">{productName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rendimento</span>
                <span className="font-bold text-foreground">{yieldQty || 1} {saleType}</span>
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Custo Total</span>
                <span className="font-bold text-foreground">R$ {baseCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro ({profitMargin[0]}%)</span>
                <span className="font-bold text-primary">R$ {profitValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-foreground">Preço de Venda</span>
                <span className="text-2xl font-extrabold text-primary">R$ {suggestedPrice.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving || !productName} className="w-full rounded-2xl h-14 text-lg font-bold btn-3d gap-2">
            <CheckCircle2 className="w-6 h-6" />
            {saving ? "Salvando..." : "SALVAR PRODUTO"}
          </Button>
        </div>
      )}

      {/* Navigation button (only Próximo, back is in header) */}
      {step < 4 && (
        <Button onClick={goNext} disabled={!canAdvance()} className="w-full rounded-2xl h-14 text-base font-bold btn-3d gap-2">
          Próximo <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Pricing;
