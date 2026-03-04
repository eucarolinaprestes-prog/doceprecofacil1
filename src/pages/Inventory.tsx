import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, AlertTriangle, Trash2 } from "lucide-react";
import { mockIngredients } from "@/services/mockData";
import type { Ingredient } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Inventory = () => {
  const [items, setItems] = useState<Ingredient[]>(mockIngredients);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [qty, setQty] = useState(0);
  const [unit, setUnit] = useState("kg");
  const [totalCost, setTotalCost] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [expDate, setExpDate] = useState("");

  const resetForm = () => { setName(""); setQty(0); setUnit("kg"); setTotalCost(0); setMinStock(0); setExpDate(""); setEditing(null); };

  const openEdit = (i: Ingredient) => {
    setEditing(i); setName(i.name); setQty(i.total_quantity); setUnit(i.unit); setTotalCost(i.total_cost); setMinStock(i.minimum_stock); setExpDate(i.expiration_date || "");
    setDialogOpen(true);
  };

  const save = () => {
    const item: Ingredient = {
      id: editing?.id || crypto.randomUUID(), user_id: "u1", name, total_quantity: qty, unit, total_cost: totalCost,
      cost_per_unit: qty > 0 ? totalCost / qty : 0, minimum_stock: minStock, expiration_date: expDate || null, created_at: editing?.created_at || new Date().toISOString(),
    };
    if (editing) setItems(items.map((i) => (i.id === editing.id ? item : i)));
    else setItems([...items, item]);
    setDialogOpen(false); resetForm();
    toast({ title: editing ? "Ingrediente atualizado!" : "Ingrediente adicionado!" });
  };

  const remove = (id: string) => { setItems(items.filter((i) => i.id !== id)); toast({ title: "Ingrediente excluído" }); };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Estoque</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Editar Ingrediente" : "Novo Ingrediente"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Quantidade" value={qty} onChange={(e) => setQty(+e.target.value)} className="h-11 rounded-xl" step="0.1" />
                <Input placeholder="Unidade (kg, un, L)" value={unit} onChange={(e) => setUnit(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Custo total R$" value={totalCost} onChange={(e) => setTotalCost(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
                <div className="flex items-center h-11 px-3 bg-secondary/50 rounded-xl text-sm">
                  Custo/un: <strong className="ml-1">R$ {qty > 0 ? (totalCost / qty).toFixed(2) : "0.00"}</strong>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Estoque mínimo" value={minStock} onChange={(e) => setMinStock(+e.target.value)} className="h-11 rounded-xl" step="0.1" />
                <Input type="date" placeholder="Validade" value={expDate} onChange={(e) => setExpDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <Button onClick={save} className="w-full h-11 rounded-xl" disabled={!name}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar ingrediente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum ingrediente encontrado.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => {
            const lowStock = i.total_quantity <= i.minimum_stock;
            return (
              <Card key={i.id} className={`border-border/50 cursor-pointer hover:shadow-md transition-shadow ${lowStock ? "border-warning/40" : ""}`} onClick={() => openEdit(i)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{i.name}</h3>
                      {lowStock && <Badge variant="outline" className="text-warning border-warning/40 text-xs gap-1"><AlertTriangle className="w-3 h-3" />Baixo</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{i.total_quantity} {i.unit} • R$ {i.cost_per_unit.toFixed(2)}/{i.unit}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); remove(i.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inventory;
