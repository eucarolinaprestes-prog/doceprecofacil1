import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const fixedCostCategories = ["aluguel", "energia", "água", "internet", "gás", "contador", "marketing", "plataformas"];
const variableCostCategories = ["combustível", "entregas", "taxas", "transporte"];

const BusinessInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [desiredSalary, setDesiredSalary] = useState("");
  const [workDays, setWorkDays] = useState("5");
  const [workHours, setWorkHours] = useState("8");

  const [fixedCosts, setFixedCosts] = useState<Record<string, string>>({});
  const [variableCosts, setVariableCosts] = useState<Record<string, string>>({});

  const hourlyRate = Number(desiredSalary) > 0
    ? Number(desiredSalary) / (Number(workDays) * 4.33 * Number(workHours))
    : 0;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profile) {
        setStoreName(profile.store_name || "");
        setWhatsapp(profile.whatsapp || "");
        setAddress(profile.address || "");
        setDesiredSalary(String(profile.desired_salary || ""));
        setWorkDays(String(profile.work_days_per_week || 5));
        setWorkHours(String(profile.work_hours_per_day || 8));
      }
      const { data: fc } = await supabase.from("fixed_costs").select("*").eq("user_id", user.id);
      const fcMap: Record<string, string> = {};
      fc?.forEach((c) => { fcMap[c.category] = String(c.amount); });
      setFixedCosts(fcMap);

      const { data: vc } = await supabase.from("variable_costs").select("*").eq("user_id", user.id);
      const vcMap: Record<string, string> = {};
      vc?.forEach((c) => { vcMap[c.category] = String(c.amount); });
      setVariableCosts(vcMap);

      setLoading(false);
    };
    load();
  }, [user]);

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

      // Upsert fixed costs
      for (const cat of fixedCostCategories) {
        const val = Number(fixedCosts[cat]) || 0;
        const { data: existing } = await supabase.from("fixed_costs").select("id").eq("user_id", user.id).eq("category", cat).single();
        if (existing) {
          await supabase.from("fixed_costs").update({ amount: val }).eq("id", existing.id);
        } else if (val > 0) {
          await supabase.from("fixed_costs").insert({ user_id: user.id, category: cat, amount: val });
        }
      }

      // Upsert variable costs
      for (const cat of variableCostCategories) {
        const val = Number(variableCosts[cat]) || 0;
        const { data: existing } = await supabase.from("variable_costs").select("id").eq("user_id", user.id).eq("category", cat).single();
        if (existing) {
          await supabase.from("variable_costs").update({ amount: val }).eq("id", existing.id);
        } else if (val > 0) {
          await supabase.from("variable_costs").insert({ user_id: user.id, category: cat, amount: val });
        }
      }

      toast({ title: "Informações salvas!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Informações do Negócio</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados da loja</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nome da loja" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-12 rounded-xl" />
          <Input placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 rounded-xl" />
          <Input placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Salário e horas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="number" placeholder="Salário desejado (R$/mês)" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Dias/semana" value={workDays} onChange={(e) => setWorkDays(e.target.value)} className="h-12 rounded-xl" />
            <Input type="number" placeholder="Horas/dia" value={workHours} onChange={(e) => setWorkHours(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="bg-secondary/50 p-4 rounded-xl">
            <p className="text-sm text-muted-foreground">Valor da sua hora:</p>
            <p className="text-xl font-bold text-primary">R$ {hourlyRate.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Custos fixos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {fixedCostCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-sm text-foreground capitalize min-w-[100px]">{cat}</span>
              <Input type="number" step="0.01" placeholder="R$ 0,00" value={fixedCosts[cat] || ""} onChange={(e) => setFixedCosts({ ...fixedCosts, [cat]: e.target.value })} className="h-10 rounded-xl" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Custos variáveis</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {variableCostCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-sm text-foreground capitalize min-w-[100px]">{cat}</span>
              <Input type="number" step="0.01" placeholder="R$ 0,00" value={variableCosts[cat] || ""} onChange={(e) => setVariableCosts({ ...variableCosts, [cat]: e.target.value })} className="h-10 rounded-xl" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-12 text-base font-semibold">
        {saving ? "Salvando..." : "Salvar informações"}
      </Button>
    </div>
  );
};

export default BusinessInfo;
