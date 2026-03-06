import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Trash2, Plus, Copy, Pencil } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const Shopping = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingredientName, setIngredientName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase.from("shopping_list").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const handleAdd = async () => {
    if (!user || !ingredientName.trim()) return;
    if (editingId) {
      await supabase.from("shopping_list").update({
        ingredient_name: ingredientName.trim(),
        quantity: Number(quantity) || 0,
        unit_price: Number(unitPrice) || 0,
      }).eq("id", editingId);
      setEditingId(null);
      setEditDialogOpen(false);
      toast({ title: "Item atualizado! ✅" });
    } else {
      await supabase.from("shopping_list").insert({
        user_id: user.id, ingredient_name: ingredientName.trim(),
        quantity: Number(quantity) || 0, unit_price: Number(unitPrice) || 0,
      });
      toast({ title: "Item adicionado! ✅" });
    }
    setIngredientName(""); setQuantity(""); setUnitPrice("");
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("shopping_list").delete().eq("id", id);
    toast({ title: "Item excluído" });
    fetchItems();
  };

  const handleCopy = async (item: any) => {
    if (!user) return;
    await supabase.from("shopping_list").insert({
      user_id: user.id, ingredient_name: `${item.ingredient_name} (cópia)`,
      quantity: item.quantity, unit_price: item.unit_price,
    });
    toast({ title: "Item copiado! ✅" });
    fetchItems();
  };

  const openEdit = (item: any) => {
    setIngredientName(item.ingredient_name);
    setQuantity(String(item.quantity || ""));
    setUnitPrice(String(item.unit_price || ""));
    setEditingId(item.id);
    setEditDialogOpen(true);
  };

  const grandTotal = items.reduce((sum, i) => sum + Number(i.total || 0), 0);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mx-auto shadow-lg">
          <ShoppingCart className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Calculadora de Compras</h1>
        <p className="text-sm text-muted-foreground">Monte sua lista e calcule o total da compra 🛒</p>
      </div>

      <Card className="card-elevated">
        <CardContent className="p-4 space-y-3">
          <Input placeholder="Nome do item" value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Quantidade" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-12 rounded-xl" />
            <Input type="number" step="0.01" placeholder="Valor (R$)" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full rounded-xl h-12 gap-2 btn-3d font-bold">
            <Plus className="w-5 h-5" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(o) => { setEditDialogOpen(o); if (!o) { setEditingId(null); setIngredientName(""); setQuantity(""); setUnitPrice(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} className="h-12 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Qtd" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-12 rounded-xl" />
              <Input type="number" step="0.01" placeholder="Valor" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-12 rounded-xl" />
            </div>
            <Button onClick={handleAdd} className="w-full rounded-xl h-12 btn-3d font-bold">Atualizar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Lista vazia" description="Adicione itens para calcular o total da sua compra." />
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((item) => (
              <Card key={item.id} className="card-elevated">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{item.ingredient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x R$ {Number(item.unit_price).toFixed(2)} = <strong className="text-primary">R$ {Number(item.total || 0).toFixed(2)}</strong>
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(item)} className="hover:bg-primary/10">
                      <Copy className="w-4 h-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="hover:bg-accent/10">
                      <Pencil className="w-4 h-4 text-accent" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 3D Total */}
          <div className="rounded-2xl p-6 text-center gradient-primary text-white btn-3d cursor-default">
            <p className="text-sm font-medium opacity-90">Total da compra</p>
            <p className="text-3xl font-extrabold">R$ {grandTotal.toFixed(2)}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Shopping;
