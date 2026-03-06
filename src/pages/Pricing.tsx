import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Calculator, ChevronLeft, ChevronRight, Check, Trash2, Pencil, Lightbulb, Camera, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const steps = ["Produto", "Ingredientes", "Custos", "Estratégia", "Resultado"];
const categories = ["Massa", "Recheio", "Bolo", "Fatias", "Cupcakes", "Salgados", "Doces"];
const saleTypes = ["Unidade", "Fatias", "Porções", "Kg"];

interface StockItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_purchased: number; total_cost: number; }
interface SelectedItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_used: number; }

const CHART_COLORS = ["hsl(350, 50%, 52%)", "hsl(30, 60%, 58%)", "hsl(152, 70%, 42%)", "hsl(280, 50%, 55%)"];

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [category, setCategory] = useState("");
  const [saleType, setSaleType] = useState("");
  const [yieldQty, setYieldQty] = useState("");

  // Step 2: ingredients & packaging from stock
  const [stockIngredients, setStockIngredients] = useState<StockItem[]>([]);
  const [stockPackaging, setStockPackaging] = useState<StockItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedItem[]>([]);
  const [selectedPackaging, setSelectedPackaging] = useState<SelectedItem[]>([]);

  // Step 3: Labor & fixed costs
  const [hourlyRate, setHourlyRate] = useState(0);
  const [prepTime, setPrepTime] = useState("");
  const [fixedCostPercent, setFixedCostPercent] = useState([10]);
  const [totalFixedCosts, setTotalFixedCosts] = useState(0);

  // Step 4: Strategy
  const [profitMargin, setProfitMargin] = useState([50]);
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
        if (salary > 0) setHourlyRate(salary / (days * 4.33 * hours));
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

  const chartData = [
    { name: "Insumos", value: ingredientsCost + packagingCost },
    { name: "Mão de obra", value: laborCost },
    { name: "Custos fixos", value: fixedCostValue },
    { name: "Lucro", value: Math.max(0, finalProfit) },
  ].filter(d => d.value > 0);

  const canAdvance = () => {
    if (step === 0) return productName.trim() && category && saleType;
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("products").insert({
        user_id: user.id, name: productName, description: productDesc, category,
        yield_quantity: Number(yieldQty) || 1, yield_unit: saleType.toLowerCase(),
        preparation_time: Number(prepTime) || 0, total_cost: baseCost,
        suggested_price: suggestedPrice, profit_margin: profitMargin[0],
        ingredients_json: selectedIngredients as any, packaging_json: selectedPackaging as any,
      });
      if (error) throw error;
      toast({ title: "Produto salvo com sucesso! 🎉" });
      setStep(0); setProductName(""); setProductDesc(""); setCategory(""); setSaleType("");
      setYieldQty(""); setSelectedIngredients([]); setSelectedPackaging([]); setPrepTime("");
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Calculator className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Precificação</h1>
        <p className="text-sm text-muted-foreground">Descubra o preço ideal para seu produto 💰</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
              i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground shadow-lg scale-110" : "bg-secondary text-muted-foreground"
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i <= step ? "text-foreground font-bold" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-success" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <Card className="card-elevated">
        <CardContent className="p-5 space-y-4">
          {/* STEP 0: Product */}
          {step === 0 && (
            <>
              <CardTitle className="text-lg flex items-center gap-2">📋 Dados do produto</CardTitle>
              <p className="text-xs text-muted-foreground">Preencha as informações básicas do produto que você vai precificar</p>

              <div className="w-full flex justify-center">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Camera className="w-8 h-8 text-primary/50" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nome do produto</label>
                <Input placeholder="Ex: Bolo de chocolate" value={productName} onChange={(e) => setProductName(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Descrição (opcional)</label>
                <Input placeholder="Ex: Bolo 2 andares com ganache" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tipo de venda</label>
                  <Select value={saleType} onValueChange={setSaleType}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {saleTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Rendimento</label>
                  <Input type="number" placeholder="Ex: 1" value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>
            </>
          )}

          {/* STEP 1: Ingredients & Packaging */}
          {step === 1 && (
            <>
              <CardTitle className="text-lg flex items-center gap-2">🧁 Ingredientes e Embalagens</CardTitle>
              <div className="bg-secondary/50 p-3 rounded-xl flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Selecione os ingredientes e embalagens do seu estoque. Informe a quantidade usada na receita.</p>
              </div>

              <p className="text-sm font-bold text-foreground">Ingredientes</p>
              <Select onValueChange={(id) => { const item = stockIngredients.find(i => i.id === id); if (item) addFromStock(item, "ingredient"); }}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="+ Adicionar do estoque..." /></SelectTrigger>
                <SelectContent>
                  {stockIngredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (R$ {i.cost_per_unit.toFixed(4)}/{i.unit})</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedIngredients.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-2.5 rounded-xl">
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{item.name}</span>
                  <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "ingredient")} className="w-20 h-9 rounded-lg text-sm" />
                  <span className="text-xs text-muted-foreground w-6">{item.unit}</span>
                  <span className="text-xs font-bold text-primary w-16 text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                  <button onClick={() => removeSelected(item.id, "ingredient")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}

              <p className="text-sm font-bold text-foreground mt-2">Embalagens</p>
              <Select onValueChange={(id) => { const item = stockPackaging.find(i => i.id === id); if (item) addFromStock(item, "packaging"); }}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="+ Adicionar do estoque..." /></SelectTrigger>
                <SelectContent>
                  {stockPackaging.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (R$ {i.cost_per_unit.toFixed(4)}/{i.unit})</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedPackaging.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-secondary/40 p-2.5 rounded-xl">
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{item.name}</span>
                  <Input type="number" placeholder="Qtd" value={item.quantity_used || ""} onChange={(e) => updateSelectedQty(item.id, Number(e.target.value), "packaging")} className="w-20 h-9 rounded-lg text-sm" />
                  <span className="text-xs text-muted-foreground w-6">{item.unit}</span>
                  <span className="text-xs font-bold text-primary w-16 text-right">R$ {(item.cost_per_unit * item.quantity_used).toFixed(2)}</span>
                  <button onClick={() => removeSelected(item.id, "packaging")} className="text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}

              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo dos ingredientes</span>
                  <span className="font-bold text-foreground">R$ {ingredientsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Custo das embalagens</span>
                  <span className="font-bold text-foreground">R$ {packagingCost.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Labor & Fixed Costs */}
          {step === 2 && (
            <>
              <CardTitle className="text-lg flex items-center gap-2">⏱️ Mão de obra e Custos fixos</CardTitle>

              <div className="bg-secondary/50 p-3 rounded-xl flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">O valor da sua hora é calculado automaticamente com base nas informações do seu perfil. Basta informar o tempo de produção!</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Tempo de produção (minutos)</label>
                <Input type="number" placeholder="Ex: 120" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="h-12 rounded-xl" />
              </div>

              <div className="bg-gradient-to-r from-secondary to-pink-light p-4 rounded-xl border border-primary/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor da sua hora</span>
                  <span className="font-bold text-foreground">R$ {hourlyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo da mão de obra</span>
                  <span className="font-bold text-primary text-lg">R$ {laborCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Custos fixos: {fixedCostPercent[0]}% → <strong className="text-primary">R$ {fixedCostValue.toFixed(2)}</strong>
                </label>
                <Slider value={fixedCostPercent} onValueChange={setFixedCostPercent} min={0} max={50} step={1} />
                <p className="text-xs text-muted-foreground">Total dos seus custos fixos mensais: R$ {totalFixedCosts.toFixed(2)}</p>
              </div>

              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo total de insumos</span>
                  <span className="font-bold">R$ {(ingredientsCost + packagingCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Mão de obra</span>
                  <span className="font-bold">R$ {laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Custos fixos</span>
                  <span className="font-bold">R$ {fixedCostValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Custo total</span>
                  <span className="font-extrabold text-primary text-lg">R$ {baseCost.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Strategy */}
          {step === 3 && (
            <>
              <CardTitle className="text-lg flex items-center gap-2">📊 Estratégia de preço</CardTitle>

              <div className="bg-secondary/50 p-3 rounded-xl flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">Uma boa margem de lucro para confeitaria fica entre 50% e 100%. Ajuste conforme sua realidade!</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Margem de lucro: <span className="text-primary">{profitMargin[0]}%</span></label>
                <Slider value={profitMargin} onValueChange={setProfitMargin} min={0} max={200} step={5} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span><span>Sugerido: 50-100%</span><span>200%</span>
                </div>
              </div>

              <div className="bg-success/10 p-4 rounded-xl border border-success/20">
                <p className="text-xs text-muted-foreground">Lucro estimado</p>
                <p className="text-2xl font-extrabold text-success">R$ {profitValue.toFixed(2)}</p>
              </div>

              <p className="text-sm font-bold text-foreground mt-2">Custos adicionais (opcionais)</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-secondary/40 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Switch checked={ifoodEnabled} onCheckedChange={setIfoodEnabled} />
                    <span className="text-sm font-medium">Taxa iFood</span>
                  </div>
                  {ifoodEnabled && (
                    <div className="flex items-center gap-1">
                      <Input type="number" value={ifoodFee} onChange={(e) => setIfoodFee(e.target.value)} className="w-16 h-8 rounded-lg text-sm text-center" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-secondary/40 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
                    <span className="text-sm font-medium">Delivery próprio</span>
                  </div>
                  {deliveryEnabled && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-20 h-8 rounded-lg text-sm text-center" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-secondary/40 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
                    <span className="text-sm font-medium">Maquininha de cartão</span>
                  </div>
                  {cardEnabled && (
                    <div className="flex items-center gap-1">
                      <Input type="number" value={cardFee} onChange={(e) => setCardFee(e.target.value)} className="w-16 h-8 rounded-lg text-sm text-center" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 4: Result */}
          {step === 4 && (
            <>
              <CardTitle className="text-lg flex items-center gap-2">🎯 Resultado final</CardTitle>

              <div className="bg-gradient-to-br from-primary/10 via-secondary to-accent/10 p-6 rounded-2xl text-center border border-primary/20">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Preço sugerido</p>
                <p className="text-4xl font-extrabold text-primary mt-1">R$ {suggestedPrice.toFixed(2)}</p>
                {Number(yieldQty) > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">por {saleType.toLowerCase()} → R$ {(suggestedPrice / Number(yieldQty)).toFixed(2)} cada</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border text-sm">
                  <span className="text-muted-foreground">Custo total</span>
                  <span className="font-bold">R$ {baseCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border text-sm">
                  <span className="text-muted-foreground">Margem de lucro</span>
                  <span className="font-extrabold text-primary">{profitMargin[0]}%</span>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-muted-foreground">Lucro</span>
                  <span className={`font-extrabold text-lg ${finalProfit >= 0 ? "text-success" : "text-destructive"}`}>R$ {finalProfit.toFixed(2)}</span>
                </div>
              </div>

              {/* Pie Chart */}
              {chartData.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-foreground flex items-center gap-2 mb-2"><PieChartIcon className="w-4 h-4 text-primary" /> Composição do preço</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                        {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Legend formatter={(value: string) => <span className="text-xs text-foreground">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Financial tip */}
              <div className="bg-secondary/50 p-4 rounded-xl border border-primary/10">
                <p className="text-xs font-bold text-foreground mb-2">💡 Dica: Como dividir o valor da venda</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between"><span>Custos (empresa)</span><span className="font-bold text-foreground">R$ {baseCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Pró-labore (você)</span><span className="font-bold text-foreground">R$ {laborCost.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Lucro da empresa</span><span className="font-bold text-success">R$ {Math.max(0, finalProfit - laborCost).toFixed(2)}</span></div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="text-xs font-bold text-foreground mb-2">📋 Resumo do produto</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Nome:</strong> {productName}</p>
                  <p><strong>Categoria:</strong> {category}</p>
                  <p><strong>Tipo:</strong> {saleType} ({yieldQty || 1})</p>
                  <p><strong>Ingredientes:</strong> {selectedIngredients.length} itens</p>
                  <p><strong>Embalagens:</strong> {selectedPackaging.length} itens</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl gap-2 flex-1">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()} className="rounded-xl gap-2 flex-1 btn-3d">
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !productName} className="rounded-xl gap-2 flex-1 btn-3d">
            <Calculator className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar produto"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Pricing;
