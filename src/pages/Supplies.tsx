import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

type TabType = "ingredients" | "packaging";

const Supplies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabType>("ingredients");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("g");
  const [totalCost, setTotalCost] = useState("");
  const [quantityPurchased, setQuantityPurchased] = useState("");
  const [supplier, setSupplier] = useState("");

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase.from(tab).select("*").eq("user_id", user.id).order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user, tab]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from(tab).insert({
      user_id: user.id,
      name: name.trim(),
      category,
      unit,
      total_cost: Number(totalCost) || 0,
      quantity_purchased: Number(quantityPurchased) || 0,
      supplier,
    });
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Item adicionado!" });
    setDialogOpen(false);
    setName(""); setCategory(""); setTotalCost(""); setQuantityPurchased(""); setSupplier("");
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from(tab).delete().eq("id", id);
    toast({ title: "Item excluído" });
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Insumos e Embalagens</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="rounded-xl">+ Adicionar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo {tab === "ingredients" ? "ingrediente" : "embalagem"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Unidade (g, ml, un)" value={unit} onChange={(e) => setUnit(e.target.value)} className="h-12 rounded-xl" />
              <Input type="number" step="0.01" placeholder="Valor pago (R$)" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="h-12 rounded-xl" />
              <Input type="number" placeholder="Quantidade comprada" value={quantityPurchased} onChange={(e) => setQuantityPurchased(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Fornecedor" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-12 rounded-xl" />
              <Button onClick={handleCreate} className="w-full rounded-xl h-12">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as TabType); setLoading(true); }}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
          <TabsTrigger value="packaging">Embalagens</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <EmptyState icon={Package} title={`Nenhum ${tab === "ingredients" ? "ingrediente" : "embalagem"} cadastrado`} description="Cadastre seus insumos para usar na precificação." actionLabel="Adicionar" onAction={() => setDialogOpen(true)} />
          ) : (
            <div className="grid gap-3 mt-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {Number(item.total_cost).toFixed(2)} / {item.quantity_purchased} {item.unit}
                        {" → "}
                        <strong className="text-primary">R$ {Number(item.cost_per_unit || 0).toFixed(4)}/{item.unit}</strong>
                      </p>
                      {item.supplier && <p className="text-xs text-muted-foreground">Fornecedor: {item.supplier}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
