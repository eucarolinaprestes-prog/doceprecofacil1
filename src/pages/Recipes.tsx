import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Pencil, Copy, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const Recipes = () => {
  const { user, businessId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    if (!user) return;
    setLoading(true);
    if (!businessId) return;
    const { data } = await supabase.from("recipes").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setRecipes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRecipes(); }, [user, businessId]);

  const handleDelete = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);
    toast({ title: "Receita excluída" });
    fetchRecipes();
  };

  const handleDuplicate = async (r: any) => {
    const { id, created_at, updated_at, ...rest } = r;
    await supabase.from("recipes").insert({ ...rest, name: `${rest.name} (cópia)` });
    toast({ title: "Receita duplicada! ✅" });
    fetchRecipes();
  };

  const openEdit = (r: any) => {
    navigate(`/pricing?edit=recipe&id=${r.id}`);
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Receitas</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas receitas 🧁</p>
      </div>

      {recipes.length === 0 ? (
        <EmptyState icon={BookOpen} title="Nenhuma receita cadastrada" description="Precifique receitas na aba Precificação." actionLabel="Ir para Precificação" onAction={() => navigate("/pricing")} />
      ) : (
        <div className="grid gap-3">
          {recipes.map((r) => {
            const ingCount = Array.isArray(r.ingredients_json) ? r.ingredients_json.length : 0;
            const yieldInfo = r.yield_quantity && r.yield_unit ? `${r.yield_quantity} ${r.yield_unit}` : null;
            const costPerUnit = yieldInfo && Number(r.yield_quantity) > 0 ? Number(r.total_cost || 0) / Number(r.yield_quantity) : null;
            return (
              <Card key={r.id} className="card-elevated">
                <CardContent className="p-4 flex items-center gap-3">
                  {(r as any).photo_url ? (
                    <img src={(r as any).photo_url} alt={r.name} className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <BookOpen className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{ingCount} ingrediente(s)</p>
                    {yieldInfo && <p className="text-xs text-muted-foreground">Rendimento: {yieldInfo}</p>}
                    <p className="text-sm font-bold text-success">Custo: R$ {Number(r.total_cost || 0).toFixed(2)}</p>
                    {costPerUnit !== null && <p className="text-xs font-bold text-primary">R$ {costPerUnit.toFixed(2)} por {r.yield_unit}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="w-4 h-4 text-primary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(r)}><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recipes;
