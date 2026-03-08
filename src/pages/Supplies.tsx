import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Trash2, Pencil, Copy, Milk, Box } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const ingredientUnits = ["g", "ml", "kg", "l"];
const packagingUnits = ["unidade", "pacote", "caixa fechada"];

const Supplies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "ingredients";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [packagingItems, setPackagingItems] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogType, setDialogType] = useState<"ingredient" | "packaging">("ingredient");


  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");
  const [quantityPurchased, setQuantityPurchased] = useState("");
  const [supplier, setSupplier] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minStock, setMinStock] = useState("");

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: ing }, { data: pkg }, { data: rec }] = await Promise.all([
      supabase.from("ingredients").select("*").eq("user_id", user.id).order("name"),
      supabase.from("packaging").select("*").eq("user_id", user.id).order("name"),
      supabase.from("recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setIngredients(ing || []);
    setPackagingItems(pkg || []);
    setRecipes(rec || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const resetForm = () => {
    setName(""); setUnit("g"); setTotalCost(""); setQuantityPurchased("");
    setSupplier(""); setEditingId(null); setCurrentStock(""); setMinStock("");
  };

  const openNewDialog = (type: "ingredient" | "packaging") => {
    resetForm();
    setDialogType(type);
    setUnit(type === "ingredient" ? "g" : "unidade");
    setDialogOpen(true);
  };

  const openEdit = (item: any, type: "ingredient" | "packaging") => {
    setName(item.name); setUnit(item.unit); setTotalCost(String(item.total_cost));
    setQuantityPurchased(String(item.quantity_purchased)); setSupplier(item.supplier || "");
    setCurrentStock(String(item.current_stock || 0)); setMinStock(String(item.min_stock || 0));
    setEditingId(item.id); setDialogType(type); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    const table = dialogType === "ingredient" ? "ingredients" : "packaging";
    const payload = {
      user_id: user.id, name: name.trim(), unit,
      total_cost: Number(totalCost) || 0,
      quantity_purchased: Number(quantityPurchased) || 0,
      supplier, category: "",
      current_stock: Number(currentStock) || 0,
      min_stock: Number(minStock) || 0,
    };
    if (editingId) {
      await supabase.from(table).update(payload).eq("id", editingId);
      toast({ title: "Atualizado! ✅" });
    } else {
      await supabase.from(table).insert(payload);
      toast({ title: "Adicionado! ✅" });
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string, table: "ingredients" | "packaging") => {
    await supabase.from(table).delete().eq("id", id);
    toast({ title: "Excluído" }); fetchAll();
  };

  const handleDuplicate = async (item: any, table: "ingredients" | "packaging") => {
    const { id, created_at, updated_at, ...rest } = item;
    await supabase.from(table).insert({ ...rest, name: `${rest.name} (cópia)` } as any);
    toast({ title: "Duplicado! ✅" }); fetchAll();
  };

  const handleDeleteRecipe = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);
    toast({ title: "Receita excluída" }); fetchAll();
  };

  const handleDuplicateRecipe = async (r: any) => {
    const { id, created_at, updated_at, ...rest } = r;
    await supabase.from("recipes").insert({ ...rest, name: `${rest.name} (cópia)` });
    toast({ title: "Receita duplicada! ✅" }); fetchAll();
  };

  const openEditRecipe = (r: any) => {
    // Navigate to pricing page in recipe mode with pre-filled data
    navigate(`/pricing?edit=recipe&id=${r.id}`);
  };

  const handleSaveRecipe = async () => {
    // No longer needed - editing happens in Pricing page
  };

  const renderItemList = (items: any[], table: "ingredients" | "packaging", type: "ingredient" | "packaging") => {
    if (items.length === 0) {
      return <EmptyState icon={type === "ingredient" ? Milk : Box} title={`Nenhum ${type === "ingredient" ? "ingrediente" : "embalagem"} cadastrado`} description="Comece cadastrando seus insumos." actionLabel="Adicionar" onAction={() => openNewDialog(type)} />;
    }
    return (
      <div className="grid gap-3">
        {items.map((item) => {
          const lowStock = Number(item.min_stock) > 0 && Number(item.current_stock) <= Number(item.min_stock);
          return (
            <Card key={item.id} className={`card-elevated ${lowStock ? "border-l-4 border-l-destructive" : ""}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">R$ {Number(item.total_cost).toFixed(2)} / {item.quantity_purchased} {item.unit}</p>
                  <p className="text-xs font-bold text-primary">Custo: R$ {Number(item.cost_per_unit || 0).toFixed(4)}/{item.unit}</p>
                  {Number(item.current_stock) > 0 && <p className="text-xs text-muted-foreground">Estoque: {item.current_stock} {item.unit}</p>}
                  {lowStock && <p className="text-xs font-bold text-destructive mt-0.5">⚠️ Estoque baixo!</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item, type)}><Pencil className="w-4 h-4 text-primary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(item, table)}><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, table)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Package className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Insumos</h1>
        <p className="text-sm text-muted-foreground">Gerencie ingredientes, embalagens e receitas 🧁</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full h-12 rounded-xl">
          <TabsTrigger value="ingredients" className="rounded-xl font-bold text-xs">🥄 Ingredientes</TabsTrigger>
          <TabsTrigger value="packaging" className="rounded-xl font-bold text-xs">📦 Embalagens</TabsTrigger>
          <TabsTrigger value="recipes" className="rounded-xl font-bold text-xs">📋 Receitas</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-4 mt-4">
          <Button onClick={() => openNewDialog("ingredient")} className="w-full rounded-xl h-12 btn-3d text-base font-bold gap-2">+ Adicionar ingrediente</Button>
          {renderItemList(ingredients, "ingredients", "ingredient")}
        </TabsContent>

        <TabsContent value="packaging" className="space-y-4 mt-4">
          <Button onClick={() => openNewDialog("packaging")} className="w-full rounded-xl h-12 btn-3d text-base font-bold gap-2">+ Adicionar embalagem</Button>
          {renderItemList(packagingItems, "packaging", "packaging")}
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4 mt-4">
          {recipes.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nenhuma receita cadastrada" description="Precifique receitas na aba Precificação." />
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
                        <Button variant="ghost" size="icon" onClick={() => openEditRecipe(r)}><Pencil className="w-4 h-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicateRecipe(r)}><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRecipe(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Shared Dialog for ingredients/packaging */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} {dialogType === "ingredient" ? "ingrediente" : "embalagem"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={dialogType === "ingredient" ? "Ex: Farinha de trigo" : "Ex: Caixa kraft"} value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{(dialogType === "ingredient" ? ingredientUnits : packagingUnits).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput placeholder="Valor pago (R$)" value={totalCost} onValueChange={setTotalCost} className="h-12 rounded-xl" />
              <Input type="number" placeholder="Qtd comprada" value={quantityPurchased} onChange={(e) => setQuantityPurchased(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Estoque atual" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className="h-12 rounded-xl" />
              <Input type="number" placeholder="Estoque mínimo" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <Input placeholder="Fornecedor (opcional)" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-12 rounded-xl" />
            <Button onClick={handleSave} className="w-full rounded-xl h-12 btn-3d font-bold">{editingId ? "Atualizar" : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Supplies;