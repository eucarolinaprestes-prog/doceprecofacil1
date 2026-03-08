import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Box, Trash2, Pencil, Copy } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const packagingUnits = ["unidade", "pacote", "caixa fechada"];

const Packaging = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("unidade");
  const [totalCost, setTotalCost] = useState("");
  const [quantityPurchased, setQuantityPurchased] = useState("");
  const [supplier, setSupplier] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minStock, setMinStock] = useState("");

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("packaging").select("*").eq("user_id", user.id).order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const resetForm = () => {
    setName(""); setUnit("unidade"); setTotalCost(""); setQuantityPurchased("");
    setSupplier(""); setEditingId(null); setCurrentStock(""); setMinStock("");
  };

  const openEdit = (item: any) => {
    setName(item.name); setUnit(item.unit); setTotalCost(String(item.total_cost));
    setQuantityPurchased(String(item.quantity_purchased)); setSupplier(item.supplier || "");
    setCurrentStock(String(item.current_stock || 0)); setMinStock(String(item.min_stock || 0));
    setEditingId(item.id); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    const payload = {
      user_id: user.id, name: name.trim(), unit,
      total_cost: Number(totalCost) || 0,
      quantity_purchased: Number(quantityPurchased) || 0,
      supplier, category: "",
      current_stock: Number(currentStock) || 0,
      min_stock: Number(minStock) || 0,
    };
    if (editingId) {
      await supabase.from("packaging").update(payload).eq("id", editingId);
      toast({ title: "Atualizado! ✅" });
    } else {
      await supabase.from("packaging").insert(payload);
      toast({ title: "Adicionado! ✅" });
    }
    setDialogOpen(false); resetForm(); fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("packaging").delete().eq("id", id);
    toast({ title: "Excluído" }); fetchItems();
  };

  const handleDuplicate = async (item: any) => {
    const { id, created_at, updated_at, ...rest } = item;
    await supabase.from("packaging").insert({ ...rest, name: `${rest.name} (cópia)` });
    toast({ title: "Duplicado! ✅" }); fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mx-auto shadow-lg">
          <Box className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Embalagens</h1>
        <p className="text-sm text-muted-foreground">Cadastre suas embalagens para usar na precificação 📦</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogTrigger asChild>
          <Button className="w-full rounded-xl h-12 btn-3d text-base font-bold gap-2">+ Adicionar embalagem</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} embalagem</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Ex: Caixa kraft" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{packagingUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" step="0.01" placeholder="Valor pago (R$)" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} className="h-12 rounded-xl" />
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

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Box} title="Nenhuma embalagem cadastrada" description="Cadastre suas embalagens para usar na precificação." actionLabel="Adicionar" onAction={() => setDialogOpen(true)} />
      ) : (
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
                    {lowStock && <p className="text-xs font-bold text-destructive mt-0.5">⚠️ Estoque baixo!</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4 text-primary" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(item)}><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default Packaging;
