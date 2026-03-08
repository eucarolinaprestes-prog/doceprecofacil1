import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface ShoppingItem {
  id?: string;
  ingredient_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const Shopping = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ShoppingItem[]>([{ ingredient_name: "", quantity: 0, unit_price: 0, total: 0 }]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    const { data } = await supabase.from("shopping_list").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setItems(data.map(d => ({ id: d.id, ingredient_name: d.ingredient_name, quantity: d.quantity || 0, unit_price: d.unit_price || 0, total: d.total || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [user]);

  const updateItem = (idx: number, field: keyof ShoppingItem, value: string) => {
    const updated = [...items];
    if (field === "ingredient_name") {
      updated[idx].ingredient_name = value;
    } else {
      const num = Number(value) || 0;
      if (field === "quantity") updated[idx].quantity = num;
      if (field === "unit_price") updated[idx].unit_price = num;
    }
    updated[idx].total = updated[idx].quantity * updated[idx].unit_price;
    
    // Auto-add new row if last row has a name
    if (idx === items.length - 1 && updated[idx].ingredient_name.trim()) {
      updated.push({ ingredient_name: "", quantity: 0, unit_price: 0, total: 0 });
    }
    setItems(updated);
  };

  const removeItem = async (idx: number) => {
    const item = items[idx];
    if (item.id) {
      await supabase.from("shopping_list").delete().eq("id", item.id);
    }
    const updated = items.filter((_, i) => i !== idx);
    if (updated.length === 0) updated.push({ ingredient_name: "", quantity: 0, unit_price: 0, total: 0 });
    setItems(updated);
    toast({ title: "Item removido" });
  };

  const saveAll = useCallback(async () => {
    if (!user) return;
    const validItems = items.filter(i => i.ingredient_name.trim());
    if (validItems.length === 0) return;
    
    // Delete all and re-insert
    await supabase.from("shopping_list").delete().eq("user_id", user.id);
    await supabase.from("shopping_list").insert(
      validItems.map(i => ({
        user_id: user.id,
        ingredient_name: i.ingredient_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      }))
    );
  }, [items, user]);

  // Auto-save on blur
  const handleBlur = () => { saveAll(); };

  const grandTotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">🛒 Calculadora de Compras</h1>
        <p className="text-sm text-muted-foreground">Monte sua lista e calcule o total</p>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_70px_80px_32px] gap-2 px-1">
        <span className="text-xs font-bold text-muted-foreground">Item</span>
        <span className="text-xs font-bold text-muted-foreground text-center">Qtd</span>
        <span className="text-xs font-bold text-muted-foreground text-center">Valor</span>
        <span></span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_70px_80px_32px] gap-2 items-center">
            <Input
              placeholder="Nome do item"
              value={item.ingredient_name}
              onChange={(e) => updateItem(idx, "ingredient_name", e.target.value)}
              onBlur={handleBlur}
              className="h-10 rounded-xl text-sm"
            />
            <Input
              type="number"
              placeholder="0"
              value={item.quantity || ""}
              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
              onBlur={handleBlur}
              className="h-10 rounded-xl text-sm text-center"
            />
            <CurrencyInput
              placeholder="0,00"
              value={item.unit_price ? String(item.unit_price) : ""}
              onValueChange={(v) => { updateItem(idx, "unit_price", v); }}
              onBlurCapture={handleBlur}
              className="h-10 rounded-xl text-sm text-center"
            />
            {items.length > 1 && item.ingredient_name.trim() ? (
              <button onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            ) : <div />}
          </div>
        ))}
      </div>

      {/* Green total */}
      <div className="rounded-2xl p-5 text-center bg-success text-success-foreground shadow-lg" style={{ boxShadow: "0 4px 0 0 hsl(152 70% 28%), 0 6px 12px -2px hsl(152 70% 38% / 0.3)" }}>
        <p className="text-sm font-medium opacity-90">Total da compra</p>
        <p className="text-3xl font-extrabold">R$ {grandTotal.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default Shopping;
