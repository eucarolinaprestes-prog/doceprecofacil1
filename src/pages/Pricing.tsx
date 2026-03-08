import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Trash2, Upload, CheckCircle2, Info, BookOpen, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// ============ MODE SELECTOR ============
type PricingMode = "select" | "product" | "recipe";

const stepLabelsProduct = ["Produto", "Ingredientes", "Mão de Obra", "Estratégia", "Salvar"];
const stepLabelsRecipe = ["Nome", "Categoria", "Ingredientes", "Resumo"];
const categories = ["Massa", "Recheio", "Bolo", "Fatias", "Cupcakes", "Salgados", "Doces", "Outros"];
const recipeCategories = ["Massa", "Recheio", "Cobertura", "Mousse", "Calda", "Creme", "Outros"];
const saleTypes = [
  { value: "unidade(s)", label: "Unidade" },
  { value: "fatia(s)", label: "Fatias" },
  { value: "porção(ões)", label: "Porções" },
  { value: "kg", label: "Kg" },
];

interface StockItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_purchased: number; total_cost: number; }
interface SelectedItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_used: number; isManual?: boolean; }

const CHART_COLORS = ["hsl(340, 75%, 55%)", "hsl(40, 80%, 55%)", "hsl(152, 70%, 38%)"];

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<PricingMode>("select");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Product step 0
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [saleType, setSaleType] = useState("");
  const [yieldQty, setYieldQty] = useState("");

  // Recipe
  const [recipeName, setRecipeName] = useState("");
  const [recipeCategory, setRecipeCategory] = useState("");
  const [customRecipeCategory, setCustomRecipeCategory] = useState("");

  // Step 1 shared
  const [stockIngredients, setStockIngredients] = useState<StockItem[]>([]);
  const [stockPackaging, setStockPackaging] = useState<StockItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedItem[]>([]);
  const [selectedPackaging, setSelectedPackaging] = useState<SelectedItem[]>([]);
  const [showIngManual, setShowIngManual] = useState(false);
  const [showPkgManual, setShowPkgManual] = useState(false);
  const [manualIng, setManualIng] = useState({ name: "", qty: "", unit: "g", cost: "" });
  const [manualPkg, setManualPkg] = useState({ name: "", qty: "", unit: "un", cost: "" });

  // Step 2 product
  const [hourlyRate, setHourlyRate] = useState(0);
  const [salaryConfigured, setSalaryConfigured] = useState(false);
  const [prepTime, setPrepTime] = useState("");
  const [fixedCostPercent, setFixedCostPercent] = useState([15]);
  const [totalFixedCosts, setTotalFixedCosts] = useState(0);

  // Step 3 product
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
      const [{ data: profileData }, { data: ing }, { data: pkg }, { data: fc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("ingredients").select("*").eq("user_id", user.id).order("name"),
        supabase.from("packaging").select("*").eq("user_id", user.id).order("name"),
        supabase.from("fixed_costs").select("*").eq("user_id", user.id),
      ]);
      if (profileData) {
        const salary = Number(profileData.desired_salary) || 0;
        const days = Number(profileData.work_days_per_week) || 5;
        const hours = Number(profileData.work_hours_per_day) || 8;
        if (salary > 0) { setHourlyRate(salary / (days * 4.33 * hours)); setSalaryConfigured(true); }
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
    setSelectedIngredients([...selectedIngredients, {
      id: `manual-${Date.now()}`, name: manualIng.name, unit: manualIng.unit,
      cost_per_unit: Number(manualIng.cost) / (Number(manualIng.qty) || 1),
      quantity_used: Number(manualIng.qty) || 1, isManual: true,
    }]);
    setManualIng({ name: "", qty: "", unit: "g", cost: "" });
    setShowIngManual(false);
  };

  const addManualPackaging = () => {
    if (!manualPkg.name.trim() || !manualPkg.cost) return;
    setSelectedPackaging([...selectedPackaging, {
      id: `manual-${Date.now()}`, name: manualPkg.name, unit: manualPkg.unit,
      cost_per_unit: Number(manualPkg.cost) / (Number(manualPkg.qty) || 1),
      quantity_used: Number(manualPkg.qty) || 1, isManual: true,
    }]);
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
    { name: "Insumos", value: ingredientsCost + packagingCost },
    { name: "Custos", value: fixedCostValue + laborCost },
    { name: "Lucro", value: Math.max(0, finalProfit) },
  ].filter(d => d.value > 0);

  const canAdvanceProduct = () => {
    if (step === 0) return productName.trim() && category && saleType && yieldQty;
    return true;
  };

  const handleSaveProduct = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("products").insert({
        user_id: user.id, name: productName, description: productDesc, category: category === "Outros" && customCategory.trim() ? customCategory.trim() : category,
        yield_quantity: Number(yieldQty) || 1, yield_unit: saleType,
        preparation_time: Number(prepTime) || 0, total_cost: baseCost,
        suggested_price: suggestedPrice, profit_margin: profitMargin[0],
        ingredients_json: selectedIngredients as any, packaging_json: selectedPackaging as any,
      });
      toast({ title: "Produto salvo com sucesso! 🎉" });
      navigate("/products");
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleSaveRecipe = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("recipes").insert({
        user_id: user.id, name: recipeName, category: recipeCategory,
        ingredients_json: selectedIngredients as any, total_cost: ingredientsCost,
      });
      toast({ title: "Receita salva com sucesso! 🎉" });
      navigate("/supplies");
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const goNext = () => {
    if (mode === "product" && canAdvanceProduct()) setStep(step + 1);
    if (mode === "recipe") setStep(step + 1);
  };
  const goBack = () => {
    if (step === 0) { setMode("select"); return; }
    setStep(Math.max(0, step - 1));
  };

  const stepLabels = mode === "product" ? stepLabelsProduct : stepLabelsRecipe;

  // ============ MODE SELECTOR ============
  if (mode === "select") {
    return (
      <div className="space-y-6 pb-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">O que você quer precificar?</h1>
          <p className="text-sm text-muted-foreground">Escolha uma opção abaixo para começar</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => { setMode("recipe"); setStep(0); }}
            className="rounded-2xl p-6 flex items-center gap-4 gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            style={{ boxShadow: "0 6px 0 0 hsl(340 75% 38%), 0 10px 20px -4px hsl(340 75% 55% / 0.4)" }}
          >
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-lg font-extrabold">Precificar Receitas</p>
              <p className="text-sm opacity-80">Massa, recheio, cobertura separados</p>
            </div>
          </button>

          <button
            onClick={() => { setMode("product"); setStep(0); }}
            className="rounded-2xl p-6 flex items-center gap-4 gradient-gold text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            style={{ boxShadow: "0 6px 0 0 hsl(30 60% 40%), 0 10px 20px -4px hsl(30 60% 58% / 0.4)" }}
          >
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-left">
              <p className="text-lg font-extrabold">Precificar Produto Final</p>
              <p className="text-sm opacity-80">Bolo, doce, salgado com custo completo</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ============ RECIPE MODE ============
  if (mode === "recipe") {
    return (
      <div className="space-y-5 pb-6">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex gap-1.5">
              {stepLabels.map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">{stepLabels[step]} • Etapa {step + 1} de {stepLabels.length}</p>
          </div>
        </div>

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-foreground">Nome da receita</h2>
            <Input placeholder="Ex: Massa de chocolate" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} className="h-12 rounded-xl" />
          </div>
        )}

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-foreground">Categoria da receita</h2>
            <div className="flex flex-wrap gap-2">
              {recipeCategories.map(c => (
                <button key={c} onClick={() => setRecipeCategory(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${recipeCategory === c ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Ingredients (only from stock, no packaging) */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-foreground">Ingredientes da receita</h2>
            <p className="text-sm text-muted-foreground">Selecione do seu estoque de ingredientes</p>

            <Select onValueChange={(id) => { const item = stockIngredients.find(i => i.id === id); if (item) addFromStock(item, "ingredient"); }}>
              <SelectTrigger className="h-12 rounded-xl bg-success/10 border-success/30 text-success font-bold">
                <span>+ Adicionar ingrediente do estoque</span>
              </SelectTrigger>
              <SelectContent>{stockIngredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (R$ {i.cost_per_unit.toFixed(4)}/{i.unit})</SelectItem>)}</SelectContent>
            </Select>

            {selectedIngredients.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
                <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "ingredient")} className="w-16 h-9 rounded-lg text-sm text-center bg-background" />
                <span className="text-xs text-muted-foreground">{item.unit}</span>
                <span className="text-xs font-bold text-primary min-w-[55px] text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                <button onClick={() => removeSelected(item.id, "ingredient")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}

            <div className="bg-success/10 border border-success/20 p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold text-foreground">Custo total da receita</span>
              <span className="text-xl font-extrabold text-success">R$ {ingredientsCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-3xl">📋</p>
              <h2 className="text-xl font-extrabold text-foreground mt-2">Resumo da Receita</h2>
            </div>
            <Card className="border border-border"><CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receita</span><span className="font-bold">{recipeName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Categoria</span><span className="font-bold">{recipeCategory}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ingredientes</span><span className="font-bold">{selectedIngredients.length}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between items-center">
                <span className="font-extrabold">Custo Total</span>
                <span className="text-2xl font-extrabold text-success">R$ {ingredientsCost.toFixed(2)}</span>
              </div>
            </CardContent></Card>

            <Button onClick={handleSaveRecipe} disabled={saving} className="w-full rounded-2xl h-14 text-lg font-bold bg-success hover:bg-success/90 text-success-foreground gap-2" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
              <CheckCircle2 className="w-6 h-6" /> {saving ? "Salvando..." : "SALVAR RECEITA"}
            </Button>
          </div>
        )}

        {step < 3 && (
          <Button onClick={goNext} disabled={step === 0 ? !recipeName.trim() : step === 1 ? !recipeCategory : false} className="w-full rounded-2xl h-14 text-base font-bold btn-3d gap-2">
            Próximo <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    );
  }

  // ============ PRODUCT MODE (existing) ============
  return (
    <div className="space-y-5 pb-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {stepLabels.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{stepLabels[step]} • Etapa {step + 1} de {stepLabels.length}</p>
        </div>
      </div>

      {/* STEP 0: Product */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">O que você quer precificar?</h2>
            <p className="text-sm text-muted-foreground">Informe os detalhes do produto</p>
          </div>

          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
              <Upload className="w-6 h-6 text-primary/50" />
              <span className="text-xs text-primary/60 font-medium">Foto</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Nome do Produto *</label>
            <Input placeholder="Ex: Bolo de Chocolate" value={productName} onChange={(e) => setProductName(e.target.value)} className="h-12 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Descrição (opcional)</label>
            <Input placeholder="Descrição curta" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="h-12 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Categoria *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${category === c ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Tipo de Venda *</label>
            <div className="flex flex-wrap gap-2">
              {saleTypes.map(t => (
                <button key={t.value} onClick={() => setSaleType(t.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${saleType === t.value ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Rendimento *</label>
            <Input type="number" placeholder="Ex: 12" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} className="h-12 rounded-xl" />
          </div>
        </div>
      )}

      {/* STEP 1: Ingredients */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Ingredientes & Embalagens</h2>
            <p className="text-sm text-muted-foreground">Adicione os insumos da receita</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">🥄 Ingredientes</h3>
              <div className="flex gap-2">
                <Select onValueChange={(id) => { const item = stockIngredients.find(i => i.id === id); if (item) addFromStock(item, "ingredient"); }}>
                  <SelectTrigger className="h-9 rounded-full bg-secondary text-primary text-xs font-bold border-0 px-4 w-auto"><span>+ Estoque</span></SelectTrigger>
                  <SelectContent>{stockIngredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
                <button onClick={() => setShowIngManual(!showIngManual)} className="h-9 rounded-full bg-muted text-muted-foreground text-xs font-bold px-4">+ Avulso</button>
              </div>
            </div>

            {showIngManual && (
              <Card className="border border-border"><CardContent className="p-4 space-y-3">
                <Input placeholder="Nome" value={manualIng.name} onChange={(e) => setManualIng({ ...manualIng, name: e.target.value })} className="h-11 rounded-xl" />
                <div className="flex gap-2">
                  <Input type="number" placeholder="Qtd" value={manualIng.qty} onChange={(e) => setManualIng({ ...manualIng, qty: e.target.value })} className="h-11 rounded-xl flex-1" />
                  <Select value={manualIng.unit} onValueChange={(v) => setManualIng({ ...manualIng, unit: v })}>
                    <SelectTrigger className="h-11 rounded-xl w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{["g", "ml", "kg", "l"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="R$" value={manualIng.cost} onChange={(e) => setManualIng({ ...manualIng, cost: e.target.value })} className="h-11 rounded-xl flex-1" />
                </div>
                <Button onClick={addManualIngredient} className="w-full rounded-xl h-10 font-bold">Adicionar</Button>
              </CardContent></Card>
            )}

            {selectedIngredients.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
                <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "ingredient")} className="w-16 h-9 rounded-lg text-sm text-center bg-background" />
                <span className="text-xs text-muted-foreground">{item.unit}</span>
                <span className="text-xs font-bold text-primary min-w-[55px] text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                <button onClick={() => removeSelected(item.id, "ingredient")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">📦 Embalagens</h3>
              <div className="flex gap-2">
                <Select onValueChange={(id) => { const item = stockPackaging.find(i => i.id === id); if (item) addFromStock(item, "packaging"); }}>
                  <SelectTrigger className="h-9 rounded-full bg-secondary text-primary text-xs font-bold border-0 px-4 w-auto"><span>+ Estoque</span></SelectTrigger>
                  <SelectContent>{stockPackaging.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
                <button onClick={() => setShowPkgManual(!showPkgManual)} className="h-9 rounded-full bg-muted text-muted-foreground text-xs font-bold px-4">+ Avulso</button>
              </div>
            </div>

            {showPkgManual && (
              <Card className="border border-border"><CardContent className="p-4 space-y-3">
                <Input placeholder="Nome" value={manualPkg.name} onChange={(e) => setManualPkg({ ...manualPkg, name: e.target.value })} className="h-11 rounded-xl" />
                <div className="flex gap-2">
                  <Input type="number" placeholder="Qtd" value={manualPkg.qty} onChange={(e) => setManualPkg({ ...manualPkg, qty: e.target.value })} className="h-11 rounded-xl flex-1" />
                  <Select value={manualPkg.unit} onValueChange={(v) => setManualPkg({ ...manualPkg, unit: v })}>
                    <SelectTrigger className="h-11 rounded-xl w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>{["un", "pacote", "caixa"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="R$" value={manualPkg.cost} onChange={(e) => setManualPkg({ ...manualPkg, cost: e.target.value })} className="h-11 rounded-xl flex-1" />
                </div>
                <Button onClick={addManualPackaging} className="w-full rounded-xl h-10 font-bold">Adicionar</Button>
              </CardContent></Card>
            )}

            {selectedPackaging.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-3 rounded-xl">
                <span className="text-sm font-medium flex-1 truncate">{item.name}</span>
                <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "packaging")} className="w-16 h-9 rounded-lg text-sm text-center bg-background" />
                <span className="text-xs text-muted-foreground">{item.unit}</span>
                <span className="text-xs font-bold text-primary min-w-[55px] text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                <button onClick={() => removeSelected(item.id, "packaging")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="bg-secondary p-4 rounded-xl flex justify-between items-center">
            <span className="font-bold text-foreground">Custo total dos insumos</span>
            <span className="text-xl font-extrabold text-primary">R$ {(ingredientsCost + packagingCost).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* STEP 2: Labor */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Mão de Obra & Custos Fixos</h2>
            <p className="text-sm text-muted-foreground">Calculado automaticamente</p>
          </div>

          <div className={`p-4 rounded-xl ${salaryConfigured ? "bg-secondary" : "bg-secondary border border-warning/30"}`}>
            {salaryConfigured ? (
              <p className="text-sm text-muted-foreground">✅ Valor da sua hora: <strong className="text-primary">R$ {hourlyRate.toFixed(2)}</strong></p>
            ) : (
              <p className="text-sm text-muted-foreground">⚠️ Configure seu salário nas Configurações → Financeiro</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tempo de produção (minutos)</label>
            <Input type="number" placeholder="Ex: 90" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="h-12 rounded-xl" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">% Custos Fixos alocados</label>
            <Slider value={fixedCostPercent} onValueChange={setFixedCostPercent} min={0} max={50} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-primary font-bold">{fixedCostPercent[0]}% = R$ {fixedCostValue.toFixed(2)}</span>
              <span>50%</span>
            </div>
          </div>

          <div className="bg-secondary p-4 rounded-xl space-y-2">
            {[
              ["Ingredientes", ingredientsCost],
              ["Embalagem", packagingCost],
              ["Mão de Obra", laborCost],
              ["Custos Fixos", fixedCostValue],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label as string}</span>
                <span className="font-bold">R$ {(val as number).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold">Custo Total</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 border border-success/20 p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-success">Lucro</p>
              <p className="text-2xl font-extrabold text-success">R$ {profitValue.toFixed(2)}</p>
            </div>
            <div className="bg-primary p-4 rounded-xl text-center">
              <p className="text-xs font-bold text-primary-foreground/80">Margem</p>
              <p className="text-3xl font-extrabold text-primary-foreground">{profitMargin[0]}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <Slider value={profitMargin} onValueChange={setProfitMargin} min={0} max={200} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span><span className="text-primary font-bold">Sugerido: 30–50%</span><span>200%</span>
            </div>
          </div>

          <Card className="border border-border"><CardContent className="p-4 space-y-3">
            <p className="font-bold text-sm">Custos Adicionais (opcional)</p>
            {[
              { label: "iFood / Uber Eats", enabled: ifoodEnabled, setEnabled: setIfoodEnabled, value: ifoodFee, setValue: setIfoodFee, suffix: "%" },
              { label: "Delivery próprio", enabled: deliveryEnabled, setEnabled: setDeliveryEnabled, value: deliveryFee, setValue: setDeliveryFee, suffix: "R$" },
              { label: "Maquininha (cartão)", enabled: cardEnabled, setEnabled: setCardEnabled, value: cardFee, setValue: setCardFee, suffix: "%" },
            ].map(fee => (
              <div key={fee.label}>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{fee.label}</span>
                  <Switch checked={fee.enabled} onCheckedChange={fee.setEnabled} />
                </div>
                {fee.enabled && (
                  <div className="flex items-center gap-2 pl-4 mt-1">
                    <Input type="number" value={fee.value} onChange={(e) => fee.setValue(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                    <span className="text-xs text-muted-foreground">{fee.suffix}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent></Card>

          {/* Green final price */}
          <div className="rounded-2xl p-6 text-center bg-success text-success-foreground shadow-lg" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
            <p className="text-sm font-medium opacity-90">Preço Final de Venda</p>
            <p className="text-4xl font-extrabold mt-1">R$ {suggestedPrice.toFixed(2)}</p>
            <p className="text-sm opacity-70 mt-1">R$ {pricePerUnit.toFixed(2)} por {saleType || "unidade"}</p>
          </div>

          {chartData.length > 0 && (
            <Card className="border border-border"><CardContent className="p-4">
              <p className="text-sm font-bold text-center mb-3">Composição do preço</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                  {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold">R$ {d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </div>
      )}

      {/* STEP 4: Save */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-3xl">🍰</p>
            <h2 className="text-xl font-extrabold text-foreground mt-2">Resumo do Produto</h2>
          </div>

          <Card className="border border-border"><CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Produto</span><span className="font-bold">{productName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Categoria</span><span className="font-bold">{category}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rendimento</span><span className="font-bold">{yieldQty} {saleType}</span></div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Custo Total</span><span className="font-bold">R$ {baseCost.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lucro ({profitMargin[0]}%)</span><span className="font-bold text-success">R$ {profitValue.toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span className="font-extrabold">Preço de Venda</span>
              <span className="text-2xl font-extrabold text-success">R$ {suggestedPrice.toFixed(2)}</span>
            </div>
          </CardContent></Card>

          <Button onClick={handleSaveProduct} disabled={saving} className="w-full rounded-2xl h-14 text-lg font-bold btn-3d gap-2">
            <CheckCircle2 className="w-6 h-6" /> {saving ? "Salvando..." : "SALVAR PRODUTO"}
          </Button>
        </div>
      )}

      {step < 4 && (
        <Button onClick={goNext} disabled={!canAdvanceProduct()} className="w-full rounded-2xl h-14 text-base font-bold btn-3d gap-2">
          Próximo <ChevronRight className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
};

export default Pricing;