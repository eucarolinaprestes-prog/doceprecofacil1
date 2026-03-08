import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Trash2, Upload, CheckCircle2, Lightbulb, BookOpen, Pencil, Camera, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";

type PricingMode = "select" | "product" | "recipe";

const stepLabelsProduct = ["Produto", "Ingredientes", "Mão de Obra", "Estratégia", "Salvar"];
const stepLabelsRecipe = ["Receita", "Ingredientes", "Rendimento", "Resumo"];
const saleTypes = [
  { value: "unidade(s)", label: "Unidade" },
  { value: "fatia(s)", label: "Fatias" },
  { value: "porção(ões)", label: "Porções" },
  { value: "kg", label: "Quilos" },
  { value: "outros", label: "Outros" },
];
const yieldUnits = [
  { value: "kg", label: "Kg" },
  { value: "g", label: "Gramas" },
  { value: "unidade", label: "Unidade" },
  { value: "ml", label: "ml" },
  { value: "l", label: "Litros" },
  { value: "disco(s)", label: "Disco(s)" },
  { value: "outros", label: "Outros" },
];
const recipeCategories = ["Massa", "Recheio", "Cobertura", "Mousse", "Calda", "Creme", "Outros"];

interface StockItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_purchased: number; total_cost: number; }
interface RecipeItem { id: string; name: string; total_cost: number; yield_quantity: number; yield_unit: string; }
interface SelectedItem { id: string; name: string; unit: string; cost_per_unit: number; quantity_used: string; isManual?: boolean; }

const CHART_COLORS = ["hsl(340, 75%, 55%)", "hsl(35, 85%, 50%)", "hsl(152, 70%, 38%)"];

const Hint = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-lg bg-warning/15 border border-warning/25 w-fit">
    <Lightbulb className="w-3.5 h-3.5 shrink-0 text-warning" />
    <p className="text-[11px] font-medium text-foreground leading-snug">{children}</p>
  </div>
);

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<PricingMode>("select");
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Product step 0
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [saleType, setSaleType] = useState("");
  const [customSaleType, setCustomSaleType] = useState("");
  const [productPhotoPreview, setProductPhotoPreview] = useState("");
  const [productPhotoFile, setProductPhotoFile] = useState<File | null>(null);
  const [productYieldQty, setProductYieldQty] = useState("");

  // Recipe
  const [recipeName, setRecipeName] = useState("");
  const [recipeCategory, setRecipeCategory] = useState("");
  const [customRecipeCategory, setCustomRecipeCategory] = useState("");
  const [recipeYieldQty, setRecipeYieldQty] = useState("");
  const [recipeYieldUnit, setRecipeYieldUnit] = useState("");
  const [customRecipeYieldUnit, setCustomRecipeYieldUnit] = useState("");
  const [recipePhotoPreview, setRecipePhotoPreview] = useState("");
  const [recipePhotoFile, setRecipePhotoFile] = useState<File | null>(null);

  // Step 1 shared
  const [stockIngredients, setStockIngredients] = useState<StockItem[]>([]);
  const [stockPackaging, setStockPackaging] = useState<StockItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedItem[]>([]);
  const [selectedPackaging, setSelectedPackaging] = useState<SelectedItem[]>([]);
  const [showIngManual, setShowIngManual] = useState(false);
  const [manualIng, setManualIng] = useState({ name: "", qty: "", unit: "g", cost: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Step 2 product
  const [hourlyRate, setHourlyRate] = useState(0);
  const [salaryConfigured, setSalaryConfigured] = useState(false);
  const [prepTime, setPrepTime] = useState("");
  const [fixedCostPercent, setFixedCostPercent] = useState([15]);
  const [totalFixedCosts, setTotalFixedCosts] = useState(0);

  // Step 3 product
  const [profitMargin, setProfitMargin] = useState([30]);
  const [ifoodEnabled, setIfoodEnabled] = useState(false);
  const [ifoodFee, setIfoodFee] = useState("");
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cardFee, setCardFee] = useState("");
  const [otherFeeEnabled, setOtherFeeEnabled] = useState(false);
  const [otherFeeName, setOtherFeeName] = useState("");
  const [otherFeeValue, setOtherFeeValue] = useState("");
  const [otherFeeType, setOtherFeeType] = useState<"percent" | "fixed">("percent");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profileData }, { data: ing }, { data: pkg }, { data: fc }, { data: rec }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("ingredients").select("*").eq("user_id", user.id).order("name"),
        supabase.from("packaging").select("*").eq("user_id", user.id).order("name"),
        supabase.from("fixed_costs").select("*").eq("user_id", user.id),
        supabase.from("recipes").select("*").eq("user_id", user.id).order("name"),
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
      setSavedRecipes(rec?.map((r: any) => ({
        id: r.id, name: r.name, total_cost: Number(r.total_cost) || 0,
        yield_quantity: Number(r.yield_quantity) || 1, yield_unit: r.yield_unit || "un",
      })) || []);

      // Check if editing a recipe from URL params
      const editType = searchParams.get("edit");
      const editId = searchParams.get("id");
      if (editType === "recipe" && editId) {
        const { data: recipe } = await supabase.from("recipes").select("*").eq("id", editId).single();
        if (recipe) {
          setEditingRecipeId(editId);
          setMode("recipe");
          setStep(0);
          setRecipeName(recipe.name);
          setRecipeCategory(recipe.category || "");
          setRecipeYieldQty(String(recipe.yield_quantity || ""));
          setRecipeYieldUnit(recipe.yield_unit || "");
          if ((recipe as any).photo_url) setRecipePhotoPreview((recipe as any).photo_url);
          if (Array.isArray(recipe.ingredients_json)) {
            setSelectedIngredients((recipe.ingredients_json as any[]).map((item: any) => ({
              id: item.id || `loaded-${Date.now()}-${Math.random()}`,
              name: item.name,
              unit: item.unit,
              cost_per_unit: Number(item.cost_per_unit) || 0,
              quantity_used: String(Number(item.quantity_used) || 0),
              isManual: true,
            })));
          }
        }
      }

      // Check if editing a product from URL params
      if (editType === "product" && editId) {
        const { data: product } = await supabase.from("products").select("*").eq("id", editId).single();
        if (product) {
          setEditingProductId(editId);
          setMode("product");
          setStep(0);
          setProductName(product.name);
          setProductDesc(product.description || "");
          setSaleType(product.yield_unit || "");
          setProductYieldQty(String(product.yield_quantity || "1"));
          if (product.photo_url) setProductPhotoPreview(product.photo_url);
          setPrepTime(String(product.preparation_time || ""));
          setProfitMargin([Number(product.profit_margin) || 30]);
          if (Array.isArray(product.ingredients_json)) {
            setSelectedIngredients((product.ingredients_json as any[]).map((item: any) => ({
              id: item.id || `loaded-${Date.now()}-${Math.random()}`,
              name: item.name, unit: item.unit,
              cost_per_unit: Number(item.cost_per_unit) || 0,
              quantity_used: String(Number(item.quantity_used) || 0),
              isManual: true,
            })));
          }
          if (Array.isArray(product.packaging_json)) {
            setSelectedPackaging((product.packaging_json as any[]).map((item: any) => ({
              id: item.id || `loaded-${Date.now()}-${Math.random()}`,
              name: item.name, unit: item.unit,
              cost_per_unit: Number(item.cost_per_unit) || 0,
              quantity_used: String(Number(item.quantity_used) || 0),
              isManual: true,
            })));
          }
        }
      }
    };
    load();
  }, [user]);

  const addFromStock = (item: StockItem, type: "ingredient" | "packaging") => {
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    if (list.find(i => i.id === item.id)) return;
    const newItem: SelectedItem = { id: item.id, name: item.name, unit: item.unit, cost_per_unit: item.cost_per_unit, quantity_used: "" };
    type === "ingredient" ? setSelectedIngredients([...list, newItem]) : setSelectedPackaging([...list, newItem]);
  };

  const addFromRecipe = (recipe: RecipeItem) => {
    if (selectedIngredients.find(i => i.id === recipe.id)) return;
    const costPerUnit = recipe.total_cost / recipe.yield_quantity;
    const newItem: SelectedItem = {
      id: recipe.id, name: recipe.name, unit: recipe.yield_unit,
      cost_per_unit: costPerUnit, quantity_used: "", isManual: true,
    };
    setSelectedIngredients([...selectedIngredients, newItem]);
  };

  const addManualIngredient = () => {
    if (!manualIng.name.trim() || !manualIng.cost) return;
    setSelectedIngredients([...selectedIngredients, {
      id: `manual-${Date.now()}`, name: manualIng.name, unit: manualIng.unit,
      cost_per_unit: Number(manualIng.cost) / (Number(manualIng.qty) || 1),
      quantity_used: manualIng.qty || "1", isManual: true,
    }]);
    setManualIng({ name: "", qty: "", unit: "g", cost: "" });
    setShowIngManual(false);
  };

  const updateSelectedQty = (id: string, qty: string, type: "ingredient" | "packaging") => {
    const setter = type === "ingredient" ? setSelectedIngredients : setSelectedPackaging;
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    setter(list.map(i => i.id === id ? { ...i, quantity_used: qty } : i));
  };

  const updateSelectedName = (id: string, name: string, type: "ingredient" | "packaging") => {
    const setter = type === "ingredient" ? setSelectedIngredients : setSelectedPackaging;
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    setter(list.map(i => i.id === id ? { ...i, name } : i));
  };

  const removeSelected = (id: string, type: "ingredient" | "packaging") => {
    const setter = type === "ingredient" ? setSelectedIngredients : setSelectedPackaging;
    const list = type === "ingredient" ? selectedIngredients : selectedPackaging;
    setter(list.filter(i => i.id !== id));
  };

  // Calculations
  const ingredientsCost = selectedIngredients.reduce((s, i) => s + i.cost_per_unit * (Number(i.quantity_used) || 0), 0);
  const packagingCost = selectedPackaging.reduce((s, i) => s + i.cost_per_unit * (Number(i.quantity_used) || 0), 0);
  const laborCost = hourlyRate * (Number(prepTime) || 0) / 60;
  const fixedCostValue = totalFixedCosts * (fixedCostPercent[0] / 100);
  const baseCost = ingredientsCost + packagingCost + laborCost + fixedCostValue;
  const profitValue = baseCost * (profitMargin[0] / 100);
  let suggestedPrice = baseCost + profitValue;
  const deliveryValue = deliveryEnabled ? Number(deliveryFee) || 0 : 0;
  suggestedPrice += deliveryValue;
  if (ifoodEnabled && Number(ifoodFee) > 0) suggestedPrice = suggestedPrice / (1 - Number(ifoodFee) / 100);
  if (cardEnabled && Number(cardFee) > 0) suggestedPrice = suggestedPrice / (1 - Number(cardFee) / 100);
  if (otherFeeEnabled && Number(otherFeeValue) > 0) {
    if (otherFeeType === "percent") suggestedPrice = suggestedPrice / (1 - Number(otherFeeValue) / 100);
    else suggestedPrice += Number(otherFeeValue);
  }
  const finalProfit = suggestedPrice - baseCost - deliveryValue;
  const finalSaleType = saleType === "outros" && customSaleType.trim() ? customSaleType.trim() : saleType;

  // Recipe cost per yield unit
  const recipeYieldNum = Number(recipeYieldQty) || 1;
  const recipeCostPerUnit = ingredientsCost / recipeYieldNum;
  const finalRecipeYieldUnit = recipeYieldUnit === "outros" && customRecipeYieldUnit.trim() ? customRecipeYieldUnit.trim() : recipeYieldUnit;

  const chartData = [
    { name: "Insumos", value: Math.max(0.01, ingredientsCost + packagingCost) },
    { name: "Custos", value: Math.max(0.01, fixedCostValue + laborCost) },
    { name: "Lucro", value: Math.max(0.01, profitValue) },
  ];

  const canAdvanceProduct = () => {
    if (step === 0) return !!(productName.trim() && saleType && productYieldQty && Number(productYieldQty) > 0);
    if (step === 1) return selectedIngredients.length > 0;
    if (step === 2) return !!(prepTime && Number(prepTime) > 0);
    return true;
  };

  const getStepError = () => {
    if (mode === "product") {
      if (step === 0) {
        if (!productName.trim()) return "Preencha o nome do produto";
        if (!saleType) return "Selecione o tipo de venda";
        if (!productYieldQty || Number(productYieldQty) <= 0) return "Informe o rendimento";
      }
      if (step === 1) {
        if (selectedIngredients.length === 0) return "Adicione pelo menos 1 ingrediente";
      }
      if (step === 2) {
        if (!prepTime || Number(prepTime) <= 0) return "Informe o tempo de produção";
      }
    }
    if (mode === "recipe") {
      if (step === 0 && !recipeName.trim()) return "Preencha o nome da receita";
      if (step === 1 && selectedIngredients.length === 0) return "Adicione pelo menos 1 ingrediente";
      if (step === 2) {
        if (!recipeYieldQty || Number(recipeYieldQty) <= 0) return "Informe o rendimento";
        if (!recipeYieldUnit) return "Selecione a unidade de medida";
      }
    }
    return null;
  };

  const handleProductPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProductPhotoFile(file);
    setProductPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProduct = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoUrl = productPhotoPreview;
      if (productPhotoFile) {
        const fileExt = productPhotoFile.name.split(".").pop();
        const filePath = `products/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, productPhotoFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }
      const payload = {
        name: productName, description: productDesc,
        category: "",
        yield_quantity: 1, yield_unit: finalSaleType,
        preparation_time: Number(prepTime) || 0, total_cost: baseCost,
        suggested_price: suggestedPrice, profit_margin: profitMargin[0],
        ingredients_json: selectedIngredients as any, packaging_json: selectedPackaging as any,
        photo_url: photoUrl || "",
      };
      if (editingProductId) {
        await supabase.from("products").update(payload).eq("id", editingProductId);
        toast({ title: "Produto atualizado com sucesso! 🎉" });
      } else {
        await supabase.from("products").insert({ ...payload, user_id: user.id });
        toast({ title: "Produto salvo com sucesso! 🎉" });
      }
      navigate("/products");
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleSaveRecipe = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let photoUrl = recipePhotoPreview;
      if (recipePhotoFile) {
        const fileExt = recipePhotoFile.name.split(".").pop();
        const filePath = `recipes/${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, recipePhotoFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }
      const finalCat = recipeCategory === "Outros" && customRecipeCategory.trim() ? customRecipeCategory.trim() : recipeCategory;
      const payload = {
        name: recipeName, category: finalCat,
        ingredients_json: selectedIngredients as any,
        total_cost: ingredientsCost, yield_quantity: recipeYieldNum,
        yield_unit: finalRecipeYieldUnit, photo_url: photoUrl,
      };
      if (editingRecipeId) {
        await supabase.from("recipes").update(payload).eq("id", editingRecipeId);
        toast({ title: "Receita atualizada com sucesso! 🎉" });
      } else {
        await supabase.from("recipes").insert({ ...payload, user_id: user.id } as any);
        toast({ title: "Receita salva com sucesso! 🎉" });
      }
      navigate("/recipes");
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const handleRecipePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecipePhotoFile(file);
    setRecipePhotoPreview(URL.createObjectURL(file));
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

  const renderItemRow = (item: SelectedItem, type: "ingredient" | "packaging") => {
    const isEditing = editingId === item.id;
    const cost = item.cost_per_unit * (Number(item.quantity_used) || 0);
    return (
      <div key={item.id} className="bg-secondary/40 p-3 rounded-xl space-y-1.5">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input value={item.name} onChange={(e) => updateSelectedName(item.id, e.target.value, type)} className="h-9 rounded-lg text-sm flex-1 min-w-0 bg-background" autoFocus onBlur={() => setEditingId(null)} />
          ) : (
            <span className="text-sm font-semibold flex-1 min-w-0 truncate">{item.name}</span>
          )}
          <input inputMode="decimal" placeholder="Qtd" value={item.quantity_used} onChange={(e) => updateSelectedQty(item.id, e.target.value, type)} className="w-[72px] h-9 rounded-lg text-sm text-center bg-background border border-input shrink-0 outline-none focus:ring-2 focus:ring-ring" />
          <span className="text-xs text-muted-foreground shrink-0 w-6">{item.unit}</span>
          <span className="text-sm font-bold text-primary shrink-0 min-w-[70px] text-right">R$ {cost.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3 pl-0.5">
          <button onClick={() => setEditingId(isEditing ? null : item.id)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="w-3 h-3" /> Editar
          </button>
          <button onClick={() => removeSelected(item.id, type)} className="flex items-center gap-1 text-[11px] text-destructive/70 hover:text-destructive transition-colors">
            <Trash2 className="w-3 h-3" /> Remover
          </button>
        </div>
      </div>
    );
  };

  // ============ MODE SELECTOR ============
  if (mode === "select") {
    return (
      <div className="space-y-6 pb-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">O que você quer precificar?</h1>
          <p className="text-sm text-muted-foreground">Escolha uma opção abaixo para começar</p>
        </div>
        <div className="grid gap-4">
          <button onClick={() => { setMode("recipe"); setStep(0); }} className="rounded-2xl p-6 flex items-center gap-4 gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-[0.98]" style={{ boxShadow: "0 6px 0 0 hsl(340 75% 38%), 0 10px 20px -4px hsl(340 75% 55% / 0.4)" }}>
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"><BookOpen className="w-7 h-7" /></div>
            <div className="text-left">
              <p className="text-lg font-extrabold">Precificar Receitas</p>
              <p className="text-sm opacity-80">Massa, recheio, cobertura separados</p>
            </div>
          </button>
          <button onClick={() => { setMode("product"); setStep(0); }} className="rounded-2xl p-6 flex items-center gap-4 gradient-gold text-white shadow-lg hover:shadow-xl transition-all active:scale-[0.98]" style={{ boxShadow: "0 6px 0 0 hsl(30 60% 40%), 0 10px 20px -4px hsl(30 60% 58% / 0.4)" }}>
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0"><CheckCircle2 className="w-7 h-7" /></div>
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
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
          <div className="flex-1">
            <div className="flex gap-1.5">{stepLabels.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />))}</div>
            <p className="text-xs text-muted-foreground mt-1 text-center">{stepLabels[step]} • Etapa {step + 1} de {stepLabels.length}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-foreground">Dados da Receita</h2>
            <label className="block cursor-pointer">
              <div className="w-full h-36 rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden relative">
                {recipePhotoPreview ? (<img src={recipePhotoPreview} alt="Foto da receita" className="w-full h-full object-cover" />) : (<><Camera className="w-8 h-8 text-primary/50" /><span className="text-sm text-primary/60 font-medium">Toque para adicionar foto</span></>)}
              </div>
              <input type="file" accept="image/*" onChange={handleRecipePhoto} className="hidden" />
            </label>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-primary">Nome da receita *</label>
              <Input placeholder="Ex: Massa de chocolate" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} className="h-12 rounded-xl" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-foreground">Ingredientes da receita</h2>
            <Select onValueChange={(id) => { const item = stockIngredients.find(i => i.id === id); if (item) addFromStock(item, "ingredient"); }}>
              <SelectTrigger className="h-12 rounded-xl bg-success/10 border-success/30 text-success font-bold"><span>+ Adicionar ingrediente do estoque</span></SelectTrigger>
              <SelectContent>{stockIngredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name} (R$ {i.cost_per_unit.toFixed(4)}/{i.unit})</SelectItem>)}</SelectContent>
            </Select>
            {selectedIngredients.length === 0 && (<p className="text-center text-sm text-muted-foreground py-4">Nenhum ingrediente adicionado ainda</p>)}
            {selectedIngredients.map(item => renderItemRow(item, "ingredient"))}
            <div className="bg-secondary p-4 rounded-xl flex justify-between items-center">
              <span className="font-bold text-foreground">Custo dos ingredientes</span>
              <span className="text-xl font-extrabold text-primary">R$ {ingredientsCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-extrabold text-foreground">Rendimento da receita</h2>
            <Hint>Ex: 2 kg de recheio, 3 discos, 500 ml de calda</Hint>
            <div className="flex gap-2">
              <input inputMode="decimal" placeholder="Ex: 2" value={recipeYieldQty} onChange={(e) => setRecipeYieldQty(e.target.value)} className="h-12 rounded-xl flex-1 border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <div className="flex-1">
                <Select value={recipeYieldUnit} onValueChange={setRecipeYieldUnit}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Medida..." /></SelectTrigger>
                  <SelectContent>{yieldUnits.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {recipeYieldUnit === "outros" && (
              <div>
                <Input placeholder="Digite a unidade de medida..." value={customRecipeYieldUnit} onChange={(e) => setCustomRecipeYieldUnit(e.target.value)} className="h-11 rounded-xl" />
                <Hint>Ex: bandeja, forma, porção...</Hint>
              </div>
            )}
            <div className="bg-success/10 border border-success/20 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Custo total da receita</span>
                <span className="text-xl font-extrabold text-success">R$ {ingredientsCost.toFixed(2)}</span>
              </div>
              {recipeYieldQty && recipeYieldUnit && (
                <div className="flex justify-between items-center border-t border-success/20 pt-2">
                  <span className="text-sm text-muted-foreground">Custo por {finalRecipeYieldUnit || "unidade"}</span>
                  <span className="text-base font-extrabold text-primary">R$ {recipeCostPerUnit.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center">
              {recipePhotoPreview && (<img src={recipePhotoPreview} alt="Foto" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-md" />)}
              <h2 className="text-xl font-extrabold text-foreground">Resumo da Receita</h2>
            </div>
            <Card className="border border-border"><CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Receita</span><span className="font-bold">{recipeName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ingredientes</span><span className="font-bold">{selectedIngredients.length}</span></div>
              {recipeYieldQty && (<div className="flex justify-between text-sm"><span className="text-muted-foreground">Rendimento</span><span className="font-bold">{recipeYieldQty} {finalRecipeYieldUnit}</span></div>)}
              <div className="border-t border-border my-2" />
              <div className="flex justify-between items-center">
                <span className="font-extrabold">Custo Total</span>
                <span className="text-2xl font-extrabold text-success">R$ {ingredientsCost.toFixed(2)}</span>
              </div>
              {recipeYieldQty && recipeYieldUnit && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Custo por {finalRecipeYieldUnit}</span>
                  <span className="text-lg font-extrabold text-primary">R$ {recipeCostPerUnit.toFixed(2)}</span>
                </div>
              )}
            </CardContent></Card>
            <Button onClick={handleSaveRecipe} disabled={saving} className="w-full rounded-2xl h-14 text-lg font-bold bg-success hover:bg-success/90 text-success-foreground gap-2" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
              <CheckCircle2 className="w-6 h-6" /> {saving ? "Salvando..." : editingRecipeId ? "ATUALIZAR RECEITA" : "SALVAR RECEITA"}
            </Button>
          </div>
        )}

        {step < 3 && (
          <Button onClick={goNext} disabled={step === 0 ? !recipeName.trim() : false} className="w-full rounded-2xl h-14 text-base font-bold btn-3d gap-2">
            Próximo <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>
    );
  }

  // ============ PRODUCT MODE ============
  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div className="flex-1">
          <div className="flex gap-1.5">{stepLabels.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />))}</div>
          <p className="text-xs text-muted-foreground mt-1 text-center">{stepLabels[step]} • Etapa {step + 1} de {stepLabels.length}</p>
        </div>
      </div>

      {/* STEP 0: Product info + photo + sale type */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Dados do Produto</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados do seu produto</p>
          </div>

          <label className="block cursor-pointer">
            <div className="w-full h-36 rounded-2xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center gap-2 bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden relative">
              {productPhotoPreview ? (
                <img src={productPhotoPreview} alt="Foto do produto" className="w-full h-full object-cover" />
              ) : (
                <><Camera className="w-8 h-8 text-primary/50" /><span className="text-sm text-primary/60 font-medium">Toque para adicionar foto</span></>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleProductPhoto} className="hidden" />
          </label>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Nome do Produto *</label>
            <Input placeholder="Ex: Bolo de Chocolate" value={productName} onChange={(e) => setProductName(e.target.value)} className="h-12 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-primary">Descrição (opcional)</label>
            <Input placeholder="Descrição curta" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="h-12 rounded-xl" />
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
            {saleType === "outros" && (
              <Input placeholder="Especifique o tipo de venda..." value={customSaleType} onChange={(e) => setCustomSaleType(e.target.value)} className="h-12 rounded-xl mt-2" />
            )}
          </div>
        </div>
      )}

      {/* STEP 1: Ingredients (stock + recipes) & Packaging (stock only) */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Ingredientes & Embalagens</h2>
            <p className="text-sm text-muted-foreground">Adicione tudo que você usa para fazer esse produto</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">🥄 Ingredientes</h3>
              <div className="flex gap-2">
                <Select onValueChange={(id) => { const item = stockIngredients.find(i => i.id === id); if (item) addFromStock(item, "ingredient"); }}>
                  <SelectTrigger className="h-8 rounded-full bg-primary/15 text-foreground text-xs font-bold border-0 px-3 w-auto"><span>+ Estoque</span></SelectTrigger>
                  <SelectContent>{stockIngredients.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select onValueChange={(id) => { const recipe = savedRecipes.find(r => r.id === id); if (recipe) addFromRecipe(recipe); }}>
                  <SelectTrigger className="h-8 rounded-full bg-primary/15 text-foreground text-xs font-bold border-0 px-3 w-auto"><span>+ Receitas</span></SelectTrigger>
                  <SelectContent>{savedRecipes.map(r => <SelectItem key={r.id} value={r.id}>{r.name} (R$ {(r.total_cost / r.yield_quantity).toFixed(2)}/{r.yield_unit})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {selectedIngredients.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-3">Nenhum ingrediente adicionado ainda</p>
            )}
            {selectedIngredients.map(item => renderItemRow(item, "ingredient"))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">📦 Embalagens</h3>
              <Select onValueChange={(id) => { const item = stockPackaging.find(i => i.id === id); if (item) addFromStock(item, "packaging"); }}>
                <SelectTrigger className="h-8 rounded-full bg-primary/15 text-foreground text-xs font-bold border-0 px-3 w-auto"><span>+ Estoque</span></SelectTrigger>
                <SelectContent>{stockPackaging.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {selectedPackaging.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-3">Nenhuma embalagem adicionada</p>
            )}
            {selectedPackaging.map(item => renderItemRow(item, "packaging"))}
          </div>

          <div className="bg-success/10 border border-success/20 p-4 rounded-xl flex justify-between items-center">
            <span className="font-bold text-foreground">Custo total dos insumos</span>
            <span className="text-xl font-extrabold text-success">R$ {(ingredientsCost + packagingCost).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* STEP 2: Labor */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Mão de Obra & Custos Fixos</h2>
            <p className="text-sm text-muted-foreground">Vamos calcular o custo do seu tempo e gastos fixos</p>
          </div>

          <div className={`p-4 rounded-xl ${salaryConfigured ? "bg-primary/10 border border-primary/20" : "bg-secondary border border-warning/30"}`}>
            {salaryConfigured ? (
              <>
                <p className="text-sm text-foreground">Valor da sua hora: <strong className="text-primary text-lg">R$ {hourlyRate.toFixed(2)}</strong></p>
                <Hint>Esse valor foi calculado com base no salário que você configurou nas Configurações</Hint>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground">⚠️ Configure seu salário nas Configurações → Financeiro</p>
                <Hint>Sem o salário configurado, a mão de obra não será incluída no cálculo</Hint>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tempo de produção (minutos)</label>
            <Input type="number" placeholder="Ex: 90" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} className="h-12 rounded-xl" />
            <Hint>Quanto tempo em minutos você leva para preparar esse produto do início ao fim?</Hint>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">% Custos Fixos alocados</label>
            <Hint>Arraste para definir quanto dos seus custos fixos (luz, gás, etc.) será alocado nesse produto</Hint>
            <Slider value={fixedCostPercent} onValueChange={setFixedCostPercent} min={0} max={50} step={1} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-primary font-bold">{fixedCostPercent[0]}% = R$ {fixedCostValue.toFixed(2)}</span>
              <span>50%</span>
            </div>
          </div>

          <div className="bg-success/10 border border-success/20 p-4 rounded-xl space-y-2">
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
            <div className="border-t border-success/20 pt-2 flex justify-between">
              <span className="font-bold">Custo Total</span>
              <span className="text-xl font-extrabold text-success">R$ {baseCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Strategy */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Estratégia de Preço</h2>
            <p className="text-sm text-muted-foreground">Defina quanto de lucro você quer ter e adicione taxas extras</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success p-4 rounded-xl text-center shadow-md">
              <p className="text-xs font-bold text-success-foreground/80">Lucro</p>
              <p className="text-2xl font-extrabold text-success-foreground">R$ {profitValue.toFixed(2)}</p>
            </div>
            <div className="bg-primary p-4 rounded-xl text-center shadow-md">
              <p className="text-xs font-bold text-primary-foreground/80">Margem</p>
              <p className="text-3xl font-extrabold text-primary-foreground">{profitMargin[0]}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <Hint>Arraste para definir sua margem de lucro. Recomendamos entre 30% e 50% para confeitaria</Hint>
            <Slider value={profitMargin} onValueChange={setProfitMargin} min={0} max={200} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span><span className="text-primary font-bold">Sugerido: 30–50%</span><span>200%</span>
            </div>
          </div>

          <Card className="border border-border"><CardContent className="p-4 space-y-4">
            <p className="font-bold text-sm">Custos Adicionais (opcional)</p>

            {/* iFood */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">iFood / Uber Eats</span>
                <Switch checked={ifoodEnabled} onCheckedChange={setIfoodEnabled} />
              </div>
              {ifoodEnabled && (
                <div className="mt-1 space-y-1 pl-4">
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Ex: 12" value={ifoodFee} onChange={(e) => setIfoodFee(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Hint>Taxa cobrada pelo aplicativo de delivery, geralmente a partir de 12%</Hint>
                </div>
              )}
            </div>

            {/* Delivery próprio */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Delivery próprio</span>
                <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
              </div>
              {deliveryEnabled && (
                <div className="mt-1 space-y-1 pl-4">
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Ex: 10" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                    <span className="text-xs text-muted-foreground">R$</span>
                  </div>
                  <Hint>Valor que você gasta com entrega (gasolina, entregador...)</Hint>
                </div>
              )}
            </div>

            {/* Maquininha */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Maquininha (cartão)</span>
                <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
              </div>
              {cardEnabled && (
                <div className="mt-1 space-y-1 pl-4">
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Ex: 3" value={cardFee} onChange={(e) => setCardFee(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                  <Hint>Taxa da maquininha de cartão, geralmente de 2% a 5%</Hint>
                </div>
              )}
            </div>

            {/* Outros */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Outros</span>
                <Switch checked={otherFeeEnabled} onCheckedChange={setOtherFeeEnabled} />
              </div>
              {otherFeeEnabled && (
                <div className="mt-1 space-y-2 pl-4">
                  <Input placeholder="Nome do custo" value={otherFeeName} onChange={(e) => setOtherFeeName(e.target.value)} className="h-9 rounded-lg text-sm" />
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Valor" value={otherFeeValue} onChange={(e) => setOtherFeeValue(e.target.value)} className="w-20 h-9 rounded-lg text-sm text-center" />
                    <div className="flex gap-1">
                      <button onClick={() => setOtherFeeType("percent")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${otherFeeType === "percent" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>%</button>
                      <button onClick={() => setOtherFeeType("fixed")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${otherFeeType === "fixed" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>R$</button>
                    </div>
                  </div>
                  <Hint>Adicione qualquer custo extra que não se encaixa nas opções acima</Hint>
                </div>
              )}
            </div>
          </CardContent></Card>

          <div className="rounded-2xl p-6 text-center bg-success text-success-foreground shadow-lg" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
            <p className="text-sm font-medium opacity-90">Preço Final de Venda</p>
            <p className="text-4xl font-extrabold mt-1">R$ {suggestedPrice.toFixed(2)}</p>
            <p className="text-sm opacity-70 mt-1">por {finalSaleType || "unidade"}</p>
          </div>

          {chartData.length > 0 && (
            <Card className="border border-primary/30 bg-background"><CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                <p className="text-sm font-extrabold text-foreground">Parabéns, você precificou! 🎉</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: CHART_COLORS[i] }}>R$ {d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/20 pt-3 space-y-3">
                <p className="text-sm text-foreground font-semibold">Agora tenha atenção em como dividir esse valor:</p>
                <div className="bg-secondary/50 p-3 rounded-xl">
                  <p className="text-xs text-foreground">💡 <strong>Dica:</strong> Separe o lucro da empresa do seu pró-labore. O lucro da empresa deve ser reinvestido no negócio.</p>
                </div>
                <div className="bg-secondary/50 p-3 rounded-xl">
                  <p className="text-xs text-foreground">💡 <strong>Dica:</strong> Reserve pelo menos 10% do faturamento para um fundo de emergência.</p>
                </div>
                <div className="bg-secondary/50 p-3 rounded-xl">
                  <p className="text-xs text-foreground">💡 <strong>Dica:</strong> Nunca cobre abaixo do custo total, mesmo para amigos e família. Ofereça descontos pequenos no lucro.</p>
                </div>
              </div>
            </CardContent></Card>
          )}
        </div>
      )}

      {/* STEP 4: Summary */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="text-center">
            {productPhotoPreview && (<img src={productPhotoPreview} alt="Foto" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3 shadow-md" />)}
            <h2 className="text-xl font-extrabold text-foreground">Resumo do Produto</h2>
            <Hint>Confira todos os dados antes de salvar. Tudo certo? Toque em Salvar!</Hint>
          </div>

          <Card className="border border-border"><CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Produto</span><span className="font-bold">{productName}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tipo de venda</span><span className="font-bold">{finalSaleType}</span></div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Custo Total</span><span className="font-bold text-success">R$ {baseCost.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lucro ({profitMargin[0]}%)</span><span className="font-bold text-success">R$ {profitValue.toFixed(2)}</span></div>
            <div className="flex justify-between items-center">
              <span className="font-extrabold">Preço de Venda</span>
              <span className="text-2xl font-extrabold text-success">R$ {suggestedPrice.toFixed(2)}</span>
            </div>
          </CardContent></Card>

          <Button onClick={handleSaveProduct} disabled={saving} className="w-full rounded-2xl h-14 text-lg font-bold btn-3d gap-2">
            <CheckCircle2 className="w-6 h-6" /> {saving ? "Salvando..." : editingProductId ? "ATUALIZAR PRODUTO" : "SALVAR PRODUTO"}
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
