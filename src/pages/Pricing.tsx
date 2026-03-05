import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calculator, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const steps = ["Produto", "Ingredientes", "Mão de obra", "Estratégia", "Resultado"];

const Pricing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Product
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [category, setCategory] = useState("");
  const [yieldQty, setYieldQty] = useState(1);
  const [yieldUnit, setYieldUnit] = useState("unidade");

  // Step 2: Ingredients cost (simplified)
  const [ingredientsCost, setIngredientsCost] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);

  // Step 3: Labor
  const [prepTime, setPrepTime] = useState(60);
  const hourlyRate = 15; // Will come from profile later

  // Step 4: Strategy
  const [profitMargin, setProfitMargin] = useState([50]);
  const [ifoodFee, setIfoodFee] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Calculations
  const laborCost = (prepTime / 60) * hourlyRate;
  const totalCost = ingredientsCost + packagingCost + laborCost;
  const suggestedPrice = totalCost * (1 + profitMargin[0] / 100) + ifoodFee + deliveryFee;
  const profit = suggestedPrice - totalCost - ifoodFee - deliveryFee;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        name: productName,
        description: productDesc,
        category,
        yield_quantity: yieldQty,
        yield_unit: yieldUnit,
        preparation_time: prepTime,
        total_cost: totalCost,
        suggested_price: suggestedPrice,
        profit_margin: profitMargin[0],
        ingredients_json: [],
        packaging_json: [],
      });
      if (error) throw error;
      toast({ title: "Produto salvo com sucesso!" });
      // Reset
      setStep(0);
      setProductName("");
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Precificação</h1>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          {step === 0 && (
            <>
              <CardTitle className="text-lg">Dados do produto</CardTitle>
              <Input placeholder="Nome do produto" value={productName} onChange={(e) => setProductName(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Descrição (opcional)" value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Rendimento" value={yieldQty} onChange={(e) => setYieldQty(Number(e.target.value))} className="h-12 rounded-xl" />
                <Select value={yieldUnit} onValueChange={setYieldUnit}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["unidade", "fatia", "porção", "kg"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <CardTitle className="text-lg">Ingredientes e Embalagens</CardTitle>
              <p className="text-sm text-muted-foreground">Informe o custo total dos ingredientes e embalagens para este produto.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Custo dos ingredientes (R$)</label>
                  <Input type="number" step="0.01" value={ingredientsCost} onChange={(e) => setIngredientsCost(Number(e.target.value))} className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Custo das embalagens (R$)</label>
                  <Input type="number" step="0.01" value={packagingCost} onChange={(e) => setPackagingCost(Number(e.target.value))} className="h-12 rounded-xl" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <CardTitle className="text-lg">Mão de obra e custos fixos</CardTitle>
              <div>
                <label className="text-sm font-medium text-foreground">Tempo de produção (minutos)</label>
                <Input type="number" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} className="h-12 rounded-xl" />
              </div>
              <div className="bg-secondary/50 p-4 rounded-xl space-y-2">
                <p className="text-sm text-muted-foreground">Valor/hora: <strong className="text-foreground">R$ {hourlyRate.toFixed(2)}</strong></p>
                <p className="text-sm text-muted-foreground">Custo da mão de obra: <strong className="text-foreground">R$ {laborCost.toFixed(2)}</strong></p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <CardTitle className="text-lg">Estratégia de preço</CardTitle>
              <div>
                <label className="text-sm font-medium text-foreground">Margem de lucro: {profitMargin[0]}%</label>
                <Slider value={profitMargin} onValueChange={setProfitMargin} min={0} max={200} step={5} className="mt-3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Taxa iFood (R$)</label>
                  <Input type="number" step="0.01" value={ifoodFee} onChange={(e) => setIfoodFee(Number(e.target.value))} className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Taxa delivery (R$)</label>
                  <Input type="number" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value))} className="h-12 rounded-xl" />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <CardTitle className="text-lg">Resultado</CardTitle>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Custo total</span>
                  <span className="font-semibold text-foreground">R$ {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Preço sugerido</span>
                  <span className="font-bold text-xl text-primary">R$ {suggestedPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Lucro</span>
                  <span className={`font-semibold ${profit >= 0 ? "text-success" : "text-destructive"}`}>R$ {profit.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl gap-2">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} className="rounded-xl gap-2">
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !productName} className="rounded-xl gap-2">
            <Calculator className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar produto"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Pricing;
