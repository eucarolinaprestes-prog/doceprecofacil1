import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, MessageCircle, Link2, Trash2, ChevronLeft, Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = { pending: "Pendente", production: "Em Produção", delivered: "Entregue" };
const statusColors: Record<string, string> = { pending: "text-warning", production: "text-primary", delivered: "text-success" };

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tab, setTab] = useState<"list" | "calendar">("list");

  // Form
  const [clientName, setClientName] = useState("");
  const [clientId, setClientId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [orderProducts, setOrderProducts] = useState<{ product_id: string; name: string; price: number }[]>([]);
  const [paymentPercent, setPaymentPercent] = useState("100");
  const [customPercent, setCustomPercent] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: ord }, { data: cli }, { data: prods }] = await Promise.all([
      supabase.from("orders").select("*, clients(name, whatsapp)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("user_id", user.id).order("name"),
      supabase.from("products").select("*").eq("user_id", user.id).order("name"),
    ]);
    setOrders(ord || []);
    setClients(cli || []);
    setProducts(prods || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const totalValue = orderProducts.reduce((s, p) => s + p.price, 0);
  const paidPercent = paymentPercent === "outro" ? Number(customPercent) || 0 : Number(paymentPercent);
  const paidValue = totalValue * (paidPercent / 100);

  const handleCreate = async () => {
    if (!user) return;
    const finalClientName = clientId ? clients.find(c => c.id === clientId)?.name || clientName : clientName;
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      client_id: clientId || null,
      event_date: eventDate || null,
      status,
      payment_percent: paidPercent,
      total_value: totalValue,
      notes,
      category: orderProducts.map(p => p.name).join(", ") || "Sem produtos",
    });
    if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
    toast({ title: "Encomenda criada! 🎉" });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setClientName(""); setClientId(""); setEventDate(""); setEventTime("");
    setStatus("pending"); setOrderProducts([]); setPaymentPercent("100");
    setCustomPercent(""); setNotes("");
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    fetchData();
  };

  const deleteOrder = async (id: string) => {
    await supabase.from("orders").delete().eq("id", id);
    toast({ title: "Encomenda excluída" });
    fetchData();
    setSelectedOrder(null);
  };

  const buildMessage = (order: any) => {
    const name = order.clients?.name || "Cliente";
    return `✅ *Confirmação de Pedido*\n\n👤 Cliente: ${name}\n📋 ${order.category || ""}\n📅 Data: ${order.event_date ? new Date(order.event_date).toLocaleDateString("pt-BR") : "A definir"}\n💰 Total: R$ ${Number(order.total_value || 0).toFixed(2)}\nPagamento: ${order.payment_percent || 100}%\n\n${order.notes ? `📝 ${order.notes}` : ""}`;
  };

  const sendWhatsApp = (order: any) => {
    const phone = order.clients?.whatsapp?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildMessage(order))}`, "_blank");
  };

  const copyMessage = (order: any) => {
    navigator.clipboard.writeText(buildMessage(order));
    toast({ title: "Resumo copiado! 📋" });
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const productionCount = orders.filter(o => o.status === "production").length;
  const todayCount = orders.filter(o => {
    if (!o.event_date) return false;
    return new Date(o.event_date).toDateString() === new Date().toDateString();
  }).length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_value || 0), 0);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  // Order detail view
  if (selectedOrder) {
    const o = selectedOrder;
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-1 text-muted-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Encomenda #{o.id.slice(0, 4).toUpperCase()}</h2>
          <p className="text-sm text-muted-foreground">{o.clients?.name || "Cliente"}</p>
          <span className={`text-xs font-bold ${statusColors[o.status]} bg-${o.status === "pending" ? "warning" : o.status === "production" ? "primary" : "success"}/10 px-2 py-0.5 rounded-full`}>
            ● {statusLabels[o.status]}
          </span>
        </div>

        <Card className="card-elevated">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Cliente & Entrega</p>
            <p className="font-bold text-foreground text-lg">{o.clients?.name || "—"}</p>
            {o.event_date && <p className="text-sm text-muted-foreground">📅 {new Date(o.event_date).toLocaleDateString("pt-BR")}</p>}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Produtos</p>
            <div className="flex justify-between">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-extrabold text-primary">R$ {Number(o.total_value || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagamento ({o.payment_percent || 100}%)</span>
              <span className="text-primary font-bold">R$ {(Number(o.total_value || 0) * (o.payment_percent || 100) / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status actions */}
        <div className="space-y-2">
          {o.status === "pending" && (
            <Button onClick={() => { updateStatus(o.id, "production"); setSelectedOrder({ ...o, status: "production" }); }} className="w-full rounded-xl h-12 btn-3d font-bold">
              Iniciar Produção
            </Button>
          )}
          {o.status === "production" && (
            <Button onClick={() => { updateStatus(o.id, "delivered"); setSelectedOrder({ ...o, status: "delivered" }); }} className="w-full rounded-xl h-12 font-bold bg-success hover:bg-success/90 text-success-foreground">
              Marcar Entregue ✅
            </Button>
          )}
        </div>

        <Button onClick={() => sendWhatsApp(o)} className="w-full rounded-xl h-12 font-bold bg-success hover:bg-success/90 text-success-foreground gap-2">
          <MessageCircle className="w-5 h-5" /> Enviar resumo no WhatsApp
        </Button>
        <Button variant="outline" onClick={() => copyMessage(o)} className="w-full rounded-xl h-12 font-bold gap-2 text-primary">
          <Link2 className="w-5 h-5" /> Copiar resumo
        </Button>
        <Button variant="outline" onClick={() => { deleteOrder(o.id); }} className="w-full rounded-xl h-12 font-bold gap-2 text-destructive">
          <Trash2 className="w-5 h-5" /> Excluir encomenda
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">📦 Encomendas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas encomendas e entregas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-10 btn-3d font-bold gap-1 px-5">+ Nova</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Encomenda</DialogTitle>
              <p className="text-sm text-muted-foreground">Preencha os dados da encomenda</p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Cliente</label>
                {clients.length > 0 ? (
                  <Select value={clientId} onValueChange={(v) => { setClientId(v); setClientName(clients.find(c => c.id === v)?.name || ""); }}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Nome do cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input placeholder="Nome do cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-12 rounded-xl" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Data de entrega</label>
                  <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-foreground">Horário</label>
                  <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="production">Em Produção</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">Produtos</label>
                  {products.length > 0 && (
                    <Select onValueChange={(id) => {
                      const p = products.find(pr => pr.id === id);
                      if (p) setOrderProducts([...orderProducts, { product_id: p.id, name: p.name, price: Number(p.suggested_price || 0) }]);
                    }}>
                      <SelectTrigger className="h-9 rounded-full bg-secondary text-primary text-xs font-bold border-0 px-4 w-auto">
                        <span>+ Adicionar Produto</span>
                      </SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - R$ {Number(p.suggested_price || 0).toFixed(2)}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
                {orderProducts.map((op, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-secondary/40 p-2 rounded-xl">
                    <span className="text-sm flex-1">{op.name}</span>
                    <span className="text-sm font-bold text-primary">R$ {op.price.toFixed(2)}</span>
                    <button onClick={() => setOrderProducts(orderProducts.filter((_, i) => i !== idx))} className="text-destructive p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">💰 Valor Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {["50", "100"].map(v => (
                    <button key={v} onClick={() => setPaymentPercent(v)}
                      className={`h-10 rounded-xl font-bold text-sm transition-all ${paymentPercent === v ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                      {v}%
                    </button>
                  ))}
                  <button onClick={() => setPaymentPercent("outro")}
                    className={`h-10 rounded-xl font-bold text-sm transition-all ${paymentPercent === "outro" ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                    Outro
                  </button>
                </div>
                {paymentPercent === "outro" && (
                  <Input type="number" placeholder="%" value={customPercent} onChange={(e) => setCustomPercent(e.target.value)} className="h-10 rounded-xl" />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-foreground">Observações (opcional)</label>
                <Textarea placeholder="Informações adicionais..." value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl" />
              </div>

              <Button onClick={handleCreate} className="w-full rounded-xl h-12 btn-3d font-bold gap-2">
                <ShoppingBag className="w-5 h-5" /> Salvar Encomenda
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-pink-light p-4 rounded-2xl">
          <p className="text-2xl font-extrabold text-primary">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl">
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{productionCount}</p>
          <p className="text-xs text-muted-foreground">Em Produção</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-2xl">
          <p className="text-2xl font-extrabold text-success">{todayCount}</p>
          <p className="text-xs text-muted-foreground">Entregas Hoje</p>
        </div>
        <div className="bg-warning/10 p-4 rounded-2xl">
          <p className="text-2xl font-extrabold text-warning">R$ {totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Lucro Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-0 bg-muted rounded-xl p-1">
        <button onClick={() => setTab("list")} className={`h-10 rounded-xl text-sm font-bold transition-all ${tab === "list" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
          📋 Lista
        </button>
        <button onClick={() => setTab("calendar")} className={`h-10 rounded-xl text-sm font-bold transition-all ${tab === "calendar" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
          📅 Calendário
        </button>
      </div>

      {/* Order list */}
      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nenhuma encomenda ainda" description="Crie sua primeira encomenda." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="card-elevated cursor-pointer" onClick={() => setSelectedOrder(o)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-foreground">{o.clients?.name || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground">{o.category || "—"}</p>
                  <p className="text-xs text-muted-foreground">{orderProducts.length || 0} produtos</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-primary">R$ {Number(o.total_value || 0).toFixed(2)}</p>
                  <span className={`text-xs font-bold ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                  <p className="text-xs text-primary">Pago: {o.payment_percent || 100}%</p>
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
