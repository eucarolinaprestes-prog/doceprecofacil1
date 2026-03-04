import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Clock, DollarSign, Trash2 } from "lucide-react";
import { mockRecipes, mockIngredients } from "@/services/mockData";
import type { Recipe, RecipeIngredient } from "@/types";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Todos", "Bolos", "Docinhos", "Tortas", "Salgados", "Outros"];

const calcRecipeCost = (r: Recipe) => {
  const ingredientCost = r.ingredients.reduce((sum, i) => sum + i.quantity * i.cost_per_unit, 0);
  return ingredientCost + r.packaging_cost + r.extra_cost;
};

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const { toast } = useToast();

  // Form state
  const [name, setName] = useState("");
  const [cat, setCat] = useState("Bolos");
  const [yieldQty, setYieldQty] = useState(1);
  const [prepTime, setPrepTime] = useState(30);
  const [packCost, setPackCost] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [ings, setIngs] = useState<RecipeIngredient[]>([]);

  const resetForm = () => {
    setName(""); setCat("Bolos"); setYieldQty(1); setPrepTime(30); setPackCost(0); setExtraCost(0); setIngs([]); setEditing(null);
  };

  const openEdit = (r: Recipe) => {
    setEditing(r); setName(r.name); setCat(r.category); setYieldQty(r.yield_quantity); setPrepTime(r.preparation_time); setPackCost(r.packaging_cost); setExtraCost(r.extra_cost); setIngs(r.ingredients);
    setDialogOpen(true);
  };

  const addIngredient = (ingId: string) => {
    const ing = mockIngredients.find((i) => i.id === ingId);
    if (!ing || ings.find((i) => i.ingredient_id === ingId)) return;
    setIngs([...ings, { id: crypto.randomUUID(), ingredient_id: ing.id, ingredient_name: ing.name, quantity: 1, unit: ing.unit, cost_per_unit: ing.cost_per_unit }]);
  };

  const save = () => {
    const recipe: Recipe = {
      id: editing?.id || crypto.randomUUID(),
      user_id: "u1", name, category: cat, yield_quantity: yieldQty, preparation_time: prepTime, packaging_cost: packCost, extra_cost: extraCost, ingredients: ings,
      created_at: editing?.created_at || new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    if (editing) {
      setRecipes(recipes.map((r) => (r.id === editing.id ? recipe : r)));
    } else {
      setRecipes([...recipes, recipe]);
    }
    setDialogOpen(false); resetForm();
    toast({ title: editing ? "Receita atualizada!" : "Receita criada!" });
  };

  const remove = (id: string) => {
    setRecipes(recipes.filter((r) => r.id !== id));
    toast({ title: "Receita excluída" });
  };

  const filtered = recipes.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todos" || r.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Receitas</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Nova</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Receita" : "Nova Receita"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome da receita" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={cat} onValueChange={setCat}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.slice(1).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Rendimento" value={yieldQty} onChange={(e) => setYieldQty(+e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Tempo (min)" value={prepTime} onChange={(e) => setPrepTime(+e.target.value)} className="h-11 rounded-xl" />
                <Input type="number" placeholder="Embalagem R$" value={packCost} onChange={(e) => setPackCost(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
                <Input type="number" placeholder="Extra R$" value={extraCost} onChange={(e) => setExtraCost(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ingredientes</label>
                <Select onValueChange={addIngredient}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Adicionar ingrediente" /></SelectTrigger>
                  <SelectContent>{mockIngredients.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
                {ings.map((ing, idx) => (
                  <div key={ing.id} className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg">
                    <span className="flex-1 text-sm">{ing.ingredient_name}</span>
                    <Input type="number" value={ing.quantity} onChange={(e) => { const updated = [...ings]; updated[idx] = { ...ing, quantity: +e.target.value }; setIngs(updated); }} className="w-20 h-8 rounded-lg text-sm" step="0.1" />
                    <span className="text-xs text-muted-foreground">{ing.unit}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIngs(ings.filter((_, i) => i !== idx))}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>

              {/* Cost preview */}
              {ings.length > 0 && (
                <Card className="bg-secondary/30 border-border/50">
                  <CardContent className="p-3 text-sm space-y-1">
                    {(() => {
                      const total = ings.reduce((s, i) => s + i.quantity * i.cost_per_unit, 0) + packCost + extraCost;
                      const unitCost = yieldQty > 0 ? total / yieldQty : 0;
                      const suggested = unitCost * 2.5;
                      return (
                        <>
                          <div className="flex justify-between"><span>Custo total:</span><strong>R$ {total.toFixed(2)}</strong></div>
                          <div className="flex justify-between"><span>Custo unitário:</span><strong>R$ {unitCost.toFixed(2)}</strong></div>
                          <div className="flex justify-between text-primary"><span>Preço sugerido (×2.5):</span><strong>R$ {suggested.toFixed(2)}</strong></div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <Button onClick={save} className="w-full h-11 rounded-xl" disabled={!name}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar receita..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-32 rounded-xl h-10"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma receita encontrada.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const cost = calcRecipeCost(r);
            const unitCost = r.yield_quantity > 0 ? cost / r.yield_quantity : 0;
            return (
              <Card key={r.id} className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(r)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{r.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{r.preparation_time}min</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {unitCost.toFixed(2)}/un</p>
                      <p className="text-xs text-muted-foreground">Rende {r.yield_quantity}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8" onClick={(e) => { e.stopPropagation(); remove(r.id); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
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
