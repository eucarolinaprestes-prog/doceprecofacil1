import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Plus } from "lucide-react";
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

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase.from("shopping_list").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const handleAdd = async () => {
    if (!user || !ingredientName.trim()) return;
    await supabase.from("shopping_list").insert({
      user_id: user.id,
      ingredient_name: ingredientName.trim(),
      quantity: Number(quantity) || 0,
      unit_price: Number(unitPrice) || 0,
    });
    setIngredientName(""); setQuantity(""); setUnitPrice("");
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("shopping_list").delete().eq("id", id);
    fetchItems();
  };

  const grandTotal = items.reduce((sum, i) => sum + Number(i.total || 0), 0);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Calculadora de Compras</h1>

      {/* Add form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Input placeholder="Ingrediente" value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} className="h-12 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Quantidade" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-12 rounded-xl" />
            <Input type="number" step="0.01" placeholder="Valor (R$)" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <Button onClick={handleAdd} className="w-full rounded-xl h-12 gap-2"><Plus className="w-4 h-4" /> Adicionar</Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Lista vazia" description="Adicione itens para calcular o total da sua compra." />
      ) : (
        <>
          <div className="grid gap-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{item.ingredient_name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity}x R$ {Number(item.unit_price).toFixed(2)} = <strong className="text-primary">R$ {Number(item.total || 0).toFixed(2)}</strong></p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">R$ {grandTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Shopping;
