import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { mockOrders, mockClients, mockRecipes } from "@/services/mockData";
import type { Order, OrderStatus, DeliveryType, PaymentMethod } from "@/types";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<OrderStatus, string> = { pending: "Pendente", paid: "Pago", delivered: "Entregue", cancelled: "Cancelado" };
const STATUS_COLORS: Record<OrderStatus, string> = { pending: "bg-warning/10 text-warning border-warning/30", paid: "bg-success/10 text-success border-success/30", delivered: "bg-primary/10 text-primary border-primary/30", cancelled: "bg-destructive/10 text-destructive border-destructive/30" };
const FILTERS: OrderStatus[] = ["pending", "paid", "delivered", "cancelled"];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [delDate, setDelDate] = useState("");
  const [delTime, setDelTime] = useState("");
  const [delType, setDelType] = useState<DeliveryType>("pickup");
  const [decFee, setDecFee] = useState(0);
  const [delFee, setDelFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("pix");
  const [status, setStatus] = useState<OrderStatus>("pending");

  const resetForm = () => {
    setClientId(""); setRecipeId(""); setQuantity(1); setDelDate(""); setDelTime(""); setDelType("pickup"); setDecFee(0); setDelFee(0); setDiscount(0); setCustomPrice(""); setPayMethod("pix"); setStatus("pending"); setEditing(null);
  };

  const openEdit = (o: Order) => {
    setEditing(o); setClientId(o.client_id); setRecipeId(o.recipe_id); setQuantity(o.quantity); setDelDate(o.delivery_date); setDelTime(o.delivery_time); setDelType(o.delivery_type); setDecFee(o.decoration_fee); setDelFee(o.delivery_fee); setDiscount(o.discount); setCustomPrice(o.custom_price?.toString() || ""); setPayMethod(o.payment_method); setStatus(o.status);
    setDialogOpen(true);
  };

  const save = () => {
    const client = mockClients.find((c) => c.id === clientId);
    const recipe = mockRecipes.find((r) => r.id === recipeId);
    const totalValue = customPrice ? +customPrice : 150 * quantity + decFee + delFee - discount;
    const order: Order = {
      id: editing?.id || crypto.randomUUID(), user_id: "u1", client_id: clientId, client_name: client?.name || "", recipe_id: recipeId, recipe_name: recipe?.name || "",
      quantity, delivery_date: delDate, delivery_time: delTime, delivery_type: delType, decoration_fee: decFee, delivery_fee: delFee, discount, custom_price: customPrice ? +customPrice : null,
      payment_method: payMethod, status, total_value: totalValue, profit: totalValue * 0.6, created_at: editing?.created_at || new Date().toISOString(),
    };
    if (editing) setOrders(orders.map((o) => (o.id === editing.id ? order : o)));
    else setOrders([...orders, order]);
    setDialogOpen(false); resetForm();
    toast({ title: editing ? "Encomenda atualizada!" : "Encomenda criada!" });
  };

  const remove = (id: string) => { setOrders(orders.filter((o) => o.id !== id)); toast({ title: "Encomenda excluída" }); };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Encomendas</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Nova</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar Encomenda" : "Nova Encomenda"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{mockClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={recipeId} onValueChange={setRecipeId}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Selecione a receita" /></SelectTrigger>
                <SelectContent>{mockRecipes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Qtd" value={quantity} onChange={(e) => setQuantity(+e.target.value)} className="h-11 rounded-xl" />
                <Input type="date" value={delDate} onChange={(e) => setDelDate(e.target.value)} className="h-11 rounded-xl" />
                <Input type="time" value={delTime} onChange={(e) => setDelTime(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={delType} onValueChange={(v) => setDelType(v as DeliveryType)}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pickup">Retirada</SelectItem><SelectItem value="delivery">Entrega</SelectItem></SelectContent>
                </Select>
                <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pix">PIX</SelectItem><SelectItem value="cash">Dinheiro</SelectItem><SelectItem value="card">Cartão</SelectItem><SelectItem value="transfer">Transferência</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input type="number" placeholder="Decoração R$" value={decFee} onChange={(e) => setDecFee(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
                <Input type="number" placeholder="Entrega R$" value={delFee} onChange={(e) => setDelFee(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
                <Input type="number" placeholder="Desconto R$" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="h-11 rounded-xl" step="0.01" />
              </div>
              <Input type="number" placeholder="Preço customizado (opcional)" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} className="h-11 rounded-xl" step="0.01" />
              {editing && (
                <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{FILTERS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                </Select>
              )}
              <Button onClick={save} className="w-full h-11 rounded-xl" disabled={!clientId || !recipeId}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilter("all")}>Todos</Button>
        {FILTERS.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFilter(s)}>{STATUS_LABELS[s]}</Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma encomenda encontrada.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <Card key={o.id} className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(o)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{o.recipe_name}</h3>
                    <p className="text-sm text-muted-foreground">{o.client_name} • {o.quantity}x</p>
                    <p className="text-xs text-muted-foreground">{o.delivery_date} às {o.delivery_time}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline" className={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    <p className="text-sm font-bold">R$ {o.total_value.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8" onClick={(e) => { e.stopPropagation(); remove(o.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
