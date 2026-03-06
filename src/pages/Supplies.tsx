import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Trash2, Pencil, Milk, Box } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

type TabType = "ingredients" | "packaging";

const ingredientUnits = ["g", "ml", "kg", "l"];
const packagingUnits = ["unidade", "pacote", "caixa fechada"];

const Supplies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>("ingredients");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");
  const [quantityPurchased, setQuantityPurchased] = useState("");
  const [supplier, setSupplier] = useState("");

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from(tab).select("*").eq("user_id", user.id).order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user, tab]);

  const resetForm = () => {
    setName(""); setUnit(tab === "ingredients" ? "g" : "unidade");
    setTotalCost(""); setQuantityPurchased(""); setSupplier(""); setEditingId(null);
  };

  const openEdit = (item: any) => {
    setName(item.name);
    setUnit(item.unit);
    setTotalCost(String(item.total_cost));
    setQuantityPurchased(String(item.quantity_purchased));
    setSupplier(item.supplier || "");
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    const payload = {
      user_id: user.id, name: name.trim(), unit,
      total_cost: Number(totalCost) || 0,
      quantity_purchased: Number(quantityPurchased) || 0,
      supplier, category: "",
    };
    if (editingId) {
      const { error } = await supabase.from(tab).update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erro ao atualizar", variant: "destructive" }); return; }
      toast({ title: "Item atualizado! ✅" });
    } else {
      const { error } = await supabase.from(tab).insert(payload);
      if (error) { toast({ title: "Erro ao adicionar", variant: "destructive" }); return; }
      toast({ title: "Item adicionado! ✅" });
    }
    setDialogOpen(false);
    resetForm();
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from(tab).delete().eq("id", id);
    toast({ title: "Item excluído" });
    fetchItems();
  };

  const units = tab === "ingredients" ? ingredientUnits : packagingUnits;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Package className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Insumos e Embalagens</h1>
        <p className="text-sm text-muted-foreground">Cadastre seus ingredientes e embalagens para usar na precificação 🧁</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabType); setLoading(true); }}>
        <TabsList className="grid grid-cols-2 w-full h-12 rounded-xl">
          <TabsTrigger value="ingredients" className="rounded-xl gap-2 font-bold">
            <Milk className="w-4 h-4" /> Ingredientes
          </TabsTrigger>
          <TabsTrigger value="packaging" className="rounded-xl gap-2 font-bold">
            <Box className="w-4 h-4" /> Embalagens
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <div className="mb-4">
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="w-full rounded-xl h-12 btn-3d text-base font-bold gap-2">
                  + Adicionar {tab === "ingredients" ? "ingrediente" : "embalagem"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Novo"} {tab === "ingredients" ? "ingrediente" : "embalagem"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Nome</label>
                    <Input placeholder={tab === "ingredients" ? "Ex: Farinha de trigo" : "Ex: Caixa kraft"} value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Unidade de medida</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Valor pago (R$)</label>
                      <Input type="number" step="0.01" placeholder="0,00" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Qtd comprada</label>
                      <Input type="number" placeholder="0" value={quantityPurchased} onChange={(e) => setQuantityPurchased(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Fornecedor (opcional)</label>
                    <Input placeholder="Ex: Atacadão" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-12 rounded-xl" />
                  </div>
                  <Button onClick={handleSave} className="w-full rounded-xl h-12 btn-3d font-bold">
                    {editingId ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Package}
              title={`Nenhum ${tab === "ingredients" ? "ingrediente" : "embalagem"} cadastrado`}
              description="Cadastre seus insumos para usar na precificação."
              actionLabel="Adicionar"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <Card key={item.id} className="card-elevated">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {Number(item.total_cost).toFixed(2)} / {item.quantity_purchased} {item.unit}
                      </p>
                      <p className="text-xs font-bold text-primary">
                        Custo unitário: R$ {Number(item.cost_per_unit || 0).toFixed(4)}/{item.unit}
                      </p>
                      {item.supplier && <p className="text-xs text-muted-foreground mt-0.5">📦 {item.supplier}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="hover:bg-primary/10">
                        <Pencil className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Supplies;
