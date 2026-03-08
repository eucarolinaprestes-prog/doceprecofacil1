import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  store?: string;
  created_at?: string;
}

const storeOptions = ["Supermercado", "Mercado", "Loja de Confeitaria", "Atacado"];

const Shopping = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  // Items per store kept in a map so switching stores doesn't erase data
  const [storeItems, setStoreItems] = useState<Record<string, ShoppingItem[]>>({});
  const [allItems, setAllItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const savingRef = useRef(false);
  const initialLoadDone = useRef(false);

  const emptyRow = (): ShoppingItem => ({ ingredient_name: "", quantity: 0, unit_price: 0, total: 0 });

  const fetchAllItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const mapped = data?.map(d => ({
      id: d.id,
      ingredient_name: d.ingredient_name,
      quantity: d.quantity || 0,
      unit_price: d.unit_price || 0,
      total: d.total || 0,
      store: (d as any).store || null,
      created_at: d.created_at,
    })) || [];

    setAllItems(mapped);

    // On initial load, populate storeItems from DB (today's items)
    if (!initialLoadDone.current) {
      const today = new Date().toISOString().slice(0, 10);
      const map: Record<string, ShoppingItem[]> = {};
      storeOptions.forEach(store => {
        const items = mapped.filter(i => i.store === store && i.created_at?.slice(0, 10) === today);
        map[store] = items.length > 0 ? [...items, emptyRow()] : [emptyRow()];
      });
      setStoreItems(map);
      initialLoadDone.current = true;
    }

    setLoading(false);
  };

  useEffect(() => { fetchAllItems(); }, [user]);

  const items = selectedStore ? (storeItems[selectedStore] || [emptyRow()]) : [];

  const setItems = (newItems: ShoppingItem[]) => {
    if (!selectedStore) return;
    setStoreItems(prev => ({ ...prev, [selectedStore]: newItems }));
  };

  const updateItem = (idx: number, field: keyof ShoppingItem, value: string) => {
    const currentItems = [...items];
    if (field === "ingredient_name") {
      currentItems[idx] = { ...currentItems[idx], ingredient_name: value };
    } else {
      const num = Number(value) || 0;
      if (field === "quantity") currentItems[idx] = { ...currentItems[idx], quantity: num };
      if (field === "unit_price") currentItems[idx] = { ...currentItems[idx], unit_price: num };
    }
    currentItems[idx] = { ...currentItems[idx], total: currentItems[idx].quantity * currentItems[idx].unit_price };

    // Auto-add new row
    if (idx === currentItems.length - 1 && currentItems[idx].ingredient_name.trim()) {
      currentItems.push(emptyRow());
    }
    setItems(currentItems);
  };

  const removeItem = async (idx: number) => {
    const item = items[idx];
    if (item.id) {
      await supabase.from("shopping_list").delete().eq("id", item.id);
    }
    const updated = items.filter((_, i) => i !== idx);
    if (updated.length === 0) updated.push(emptyRow());
    setItems(updated);
    fetchAllItems();
    toast({ title: "Item removido" });
  };

  const saveAll = useCallback(async () => {
    if (!user || !selectedStore || savingRef.current) return;
    const validItems = items.filter(i => i.ingredient_name.trim());
    if (validItems.length === 0) return;

    savingRef.current = true;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const todayIds = allItems
        .filter(i => i.store === selectedStore && i.created_at?.slice(0, 10) === today)
        .map(i => i.id)
        .filter(Boolean);

      if (todayIds.length > 0) {
        await supabase.from("shopping_list").delete().in("id", todayIds as string[]);
      }

      await supabase.from("shopping_list").insert(
        validItems.map(i => ({
          user_id: user.id,
          ingredient_name: i.ingredient_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total: i.quantity * i.unit_price,
          store: selectedStore,
        }))
      );

      // Silently refresh allItems
      const { data } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setAllItems(data?.map(d => ({
        id: d.id,
        ingredient_name: d.ingredient_name,
        quantity: d.quantity || 0,
        unit_price: d.unit_price || 0,
        total: d.total || 0,
        store: (d as any).store || null,
        created_at: d.created_at,
      })) || []);
    } finally {
      savingRef.current = false;
    }
  }, [items, user, selectedStore, allItems]);

  const handleBlur = () => {
    setTimeout(() => saveAll(), 400);
  };

  const grandTotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0);

  // History: group by date and store
  const history = useMemo(() => {
    const grouped: Record<string, Record<string, { items: ShoppingItem[]; total: number }>> = {};
    allItems.forEach(item => {
      const date = item.created_at?.slice(0, 10) || "sem-data";
      const store = item.store || "Sem local";
      if (!grouped[date]) grouped[date] = {};
      if (!grouped[date][store]) grouped[date][store] = { items: [], total: 0 };
      grouped[date][store].items.push(item);
      grouped[date][store].total += item.total || 0;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, stores]) => ({
        date,
        stores: Object.entries(stores).map(([store, data]) => ({ store, ...data })),
        dayTotal: Object.values(stores).reduce((s, d) => s + d.total, 0),
      }));
  }, [allItems]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-primary/10 p-4">
        <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">🛒 Calculadora de Compras</h1>
        <p className="text-sm text-muted-foreground">Escolha o local e monte sua lista</p>
      </div>

      {/* Store selector - pink background, green when active */}
      <div>
        <p className="text-sm font-bold text-foreground mb-2">Local da compra</p>
        <div className="grid grid-cols-2 gap-2">
          {storeOptions.map(store => (
            <button
              key={store}
              onClick={() => { setSelectedStore(store); setShowHistory(false); }}
              className={`rounded-2xl py-3 px-2 text-center font-bold text-sm transition-all border-2 ${
                selectedStore === store
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-lg scale-[1.02]"
                  : "bg-primary text-white border-primary shadow-md"
              }`}
              style={selectedStore === store
                ? { boxShadow: "0 4px 0 0 hsl(150 50% 30%)" }
                : { boxShadow: "0 4px 0 0 hsl(340 75% 40%)" }
              }
            >
              <span className="block text-white">{store}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calculator area */}
      {selectedStore && !showHistory && (
        <>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-foreground">Comprando em: <span className="text-primary">{selectedStore}</span></p>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_60px_80px_32px] gap-2 px-1">
            <span className="text-xs font-bold text-muted-foreground">Item</span>
            <span className="text-xs font-bold text-muted-foreground text-center">Qtd</span>
            <span className="text-xs font-bold text-muted-foreground text-center">Preço</span>
            <span></span>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_60px_80px_32px] gap-2 items-center">
                <Input
                  placeholder="Nome do item"
                  value={item.ingredient_name}
                  onChange={(e) => updateItem(idx, "ingredient_name", e.target.value)}
                  onBlur={handleBlur}
                  className="h-10 rounded-xl text-sm"
                />
                <Input
                  type="number"
                  inputMode="numeric"
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
            <p className="text-sm font-medium opacity-90">Total — {selectedStore}</p>
            <p className="text-3xl font-extrabold">R$ {grandTotal.toFixed(2)}</p>
          </div>
          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => { saveAll(); toast({ title: "Compra finalizada!", description: `${selectedStore} salvo no histórico.` }); }}
              className="w-full rounded-2xl h-12 font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white"
              style={{ boxShadow: "0 4px 0 0 hsl(150 50% 30%)" }}
            >
              ✅ Finalizar Compras
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (!selectedStore) return;
                setStoreItems(prev => ({ ...prev, [selectedStore]: [emptyRow()] }));
                toast({ title: "Carrinho limpo!" });
              }}
              className="w-full rounded-2xl h-12 font-bold text-sm border-primary text-primary hover:bg-primary/10"
            >
              🧹 Limpar Carrinho
            </Button>
          </div>
        </>
      )}

      {/* History toggle */}
      <button
        onClick={() => { setShowHistory(!showHistory); }}
        className={`w-full rounded-2xl py-3 px-4 text-center font-bold text-sm transition-all border-2 ${
          showHistory
            ? "bg-primary text-white border-primary shadow-lg"
            : "bg-primary/10 text-primary border-primary/20"
        }`}
      >
        📊 Histórico de Compras
      </button>

      {/* History */}
      {showHistory && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Sem histórico" description="Suas compras aparecerão aqui." />
          ) : (
            history.map(day => (
              <Card key={day.date} className="card-elevated">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="font-extrabold text-base text-foreground">
                      {day.date === "sem-data" ? "Sem data" : new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-lg font-extrabold text-primary">R$ {day.dayTotal.toFixed(2)}</p>
                  </div>

                  {day.stores.map(s => (
                    <div key={s.store} className="bg-muted/50 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-sm text-foreground">{s.store}</p>
                        <p className="font-extrabold text-sm text-success">R$ {s.total.toFixed(2)}</p>
                      </div>
                      <div className="space-y-0.5">
                        {s.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span>{item.ingredient_name} (x{item.quantity})</span>
                            <span>R$ {item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Shopping;
