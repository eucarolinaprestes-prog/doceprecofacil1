import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, MessageCircle, Link2, Trash2, Copy, ChevronLeft, CreditCard, Smartphone, Pencil } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = { pending: "Pendente", scheduled: "Agendado", production: "Em Produção", finished: "Finalizado", delivered: "Entregue" };
const statusColors: Record<string, string> = { pending: "text-warning", scheduled: "text-primary", production: "text-blue-500", finished: "text-success", delivered: "text-success" };
const orderCategories = ["Bolos", "Doces", "Salgados", "Cupcakes", "Fatias", "Outros"];

const Orders = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [whatsappPreview, setWhatsappPreview] = useState<string | null>(null);
  const [whatsappOrder, setWhatsappOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  // Form
  const [clientId, setClientId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [orderCategory, setOrderCategory] = useState("");
  const [size, setSize] = useState("");
  const [dough, setDough] = useState("");
  const [filling, setFilling] = useState("");
  const [topping, setTopping] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [paymentPercent, setPaymentPercent] = useState("100");
  const [customPercent, setCustomPercent] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [notes, setNotes] = useState("");
  const [observation, setObservation] = useState("");

  // Optional fees
  const [feePackaging, setFeePackaging] = useState({ enabled: false, value: "" });
  const [feeTopper, setFeeTopper] = useState({ enabled: false, value: "" });
  const [feeDecoration, setFeeDecoration] = useState({ enabled: false, value: "" });
  const [feeDelivery, setFeeDelivery] = useState({ enabled: false, value: "" });
  const [feeCard, setFeeCard] = useState({ enabled: false, value: "" });

  const fetchData = async () => {
    if (!user) return;
    const [{ data: ord }, { data: cli }, { data: prods }] = await Promise.all([
      supabase.from("orders").select("*, clients(name, whatsapp, address)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("user_id", user.id).order("name"),
      supabase.from("products").select("*").eq("user_id", user.id).order("name"),
    ]);
    setOrders(ord || []);
    setClients(cli || []);
    setProducts(prods || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const paidPercent = paymentPercent === "outro" ? Number(customPercent) || 0 : Number(paymentPercent);
  const extraFees = (feePackaging.enabled ? Number(feePackaging.value) || 0 : 0) +
    (feeTopper.enabled ? Number(feeTopper.value) || 0 : 0) +
    (feeDecoration.enabled ? Number(feeDecoration.value) || 0 : 0) +
    (feeDelivery.enabled ? Number(feeDelivery.value) || 0 : 0);
  const baseVal = Number(totalValue) || 0;
  const cardPercent = feeCard.enabled ? Number(feeCard.value) || 0 : 0;
  const finalValue = (baseVal + extraFees) * (1 + cardPercent / 100);

  const handleCreate = async () => {
    if (!user) return;
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      client_id: clientId || null,
      event_date: eventDate || null,
      status,
      payment_percent: paidPercent,
      payment_method: paymentMethod,
      total_value: finalValue,
      notes,
      category: orderCategory,
      size, filling, topping, dough,
      delivery_type: deliveryType,
      observation,
      fee_packaging: feePackaging.enabled ? Number(feePackaging.value) || 0 : 0,
      fee_topper: feeTopper.enabled ? Number(feeTopper.value) || 0 : 0,
      fee_decoration: feeDecoration.enabled ? Number(feeDecoration.value) || 0 : 0,
      fee_delivery: feeDelivery.enabled ? Number(feeDelivery.value) || 0 : 0,
      fee_card_percent: cardPercent,
    });
    if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
    toast({ title: "Encomenda criada! 🎉" });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setClientId(""); setEventDate(""); setEventTime(""); setStatus("pending");
    setOrderCategory(""); setSize(""); setDough(""); setFilling(""); setTopping("");
    setTotalValue(""); setPaymentPercent("100"); setCustomPercent(""); setPaymentMethod("pix");
    setDeliveryType("pickup"); setNotes(""); setObservation("");
    setFeePackaging({ enabled: false, value: "" }); setFeeTopper({ enabled: false, value: "" });
    setFeeDecoration({ enabled: false, value: "" }); setFeeDelivery({ enabled: false, value: "" });
    setFeeCard({ enabled: false, value: "" });
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

  const duplicateOrder = async (o: any) => {
    const { id, created_at, updated_at, clients: _, ...rest } = o;
    await supabase.from("orders").insert({ ...rest, status: "pending" });
    toast({ title: "Encomenda duplicada! ✅" });
    fetchData();
  };

  const buildMessage = (order: any) => {
    const clientName = order.clients?.name || "Cliente";
    const clientAddr = order.clients?.address || "";
    const confAddr = profile?.address || "";
    
    let msg = `✅ *Confirmação de Pedido*\n\n`;
    msg += `👤 Cliente: ${clientName}\n`;
    msg += `📋 ${order.category || ""}\n`;
    if (order.size) msg += `📏 Tamanho: ${order.size}\n`;
    if (order.filling) msg += `🍰 Recheio: ${order.filling}\n`;
    if (order.topping) msg += `🎨 Cobertura: ${order.topping}\n`;
    msg += `📅 Data: ${order.event_date ? new Date(order.event_date).toLocaleDateString("pt-BR") : "A definir"}\n`;
    msg += `💰 Total: R$ ${Number(order.total_value || 0).toFixed(2)}\n`;
    msg += `💳 Pagamento: ${order.payment_method?.toUpperCase() || "PIX"} - ${order.payment_percent || 100}%\n`;

    if (order.delivery_type === "pickup" && confAddr) {
      msg += `\n📍 *Retirada no endereço:*\n${confAddr}\n`;
    } else if (order.delivery_type === "delivery" && clientAddr) {
      msg += `\n📍 *Entrega no endereço:*\n${clientAddr}\n`;
    }

    if (order.notes) msg += `\n📝 ${order.notes}\n`;

    // Payment warning
    if (order.payment_percent < 100) {
      msg += `\n⚠️ *Informamos que a encomenda somente será entregue após o pagamento total do pedido.*\n`;
    }

    // Care instructions
    msg += `\n✨ Olá ${clientName}, seu pedido foi finalizado com muito carinho!\n`;
    msg += `\n🚗 *Dicas importantes para transporte:*\n`;
    msg += `• Transportar sempre em superfície plana\n`;
    msg += `• Evitar sol e calor\n`;
    msg += `• Não colocar objetos sobre a caixa\n`;
    msg += `• Manter refrigerado se necessário\n`;

    msg += `\n⚠️ *Após a retirada ou entrega do produto, não nos responsabilizamos por danos causados durante transporte inadequado ou armazenamento incorreto.*`;

    return msg;
  };

  const openWhatsAppPreview = (order: any) => {
    setWhatsappPreview(buildMessage(order));
    setWhatsappOrder(order);
  };

  const sendWhatsApp = () => {
    if (!whatsappOrder || !whatsappPreview) return;
    const phone = whatsappOrder.clients?.whatsapp?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappPreview)}`, "_blank");
    setWhatsappPreview(null);
    setWhatsappOrder(null);
  };

  const pendingCount = orders.filter(o => o.status === "pending" || o.status === "scheduled").length;
  const productionCount = orders.filter(o => o.status === "production").length;
  const deliveredCount = orders.filter(o => o.status === "delivered" || o.status === "finished").length;

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => {
    if (statusFilter === "pending") return o.status === "pending" || o.status === "scheduled";
    if (statusFilter === "production") return o.status === "production";
    if (statusFilter === "delivered") return o.status === "delivered" || o.status === "finished";
    return true;
  });

  const nextStatus: Record<string, string> = { pending: "production", scheduled: "production", production: "finished", finished: "delivered" };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <ShoppingBag className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Encomendas</h1>
        <p className="text-sm text-muted-foreground">Gerencie todos os seus pedidos em um só lugar 📦</p>
      </div>

      <Button onClick={() => setDialogOpen(true)} className="w-full rounded-xl h-14 btn-3d font-bold text-base gap-2">
        + Nova Encomenda
      </Button>

      {/* Status tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid grid-cols-3 w-full h-12 rounded-xl">
          <TabsTrigger value="pending" className="rounded-xl font-bold text-xs">Pendentes ({pendingCount})</TabsTrigger>
          <TabsTrigger value="production" className="rounded-xl font-bold text-xs">Produção ({productionCount})</TabsTrigger>
          <TabsTrigger value="delivered" className="rounded-xl font-bold text-xs">Entregues ({deliveredCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Order list */}
      {filteredOrders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nenhuma encomenda" description="Crie sua primeira encomenda." />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((o) => (
            <Card key={o.id} className="card-elevated border-l-4 border-l-warning">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-warning/10 ${statusColors[o.status]}`}>
                      {statusLabels[o.status] || o.status}
                    </span>
                    <p className="font-bold text-foreground mt-1">{o.clients?.name || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{o.category || "—"}</p>
                  </div>
                  <p className="text-xl font-extrabold text-primary">R$ {Number(o.total_value || 0).toFixed(2)}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {nextStatus[o.status] && (
                    <Button size="sm" onClick={() => updateStatus(o.id, nextStatus[o.status])} className="rounded-xl btn-3d font-bold text-xs h-9">
                      {o.status === "pending" || o.status === "scheduled" ? "Iniciar produção" : o.status === "production" ? "Finalizar" : "Marcar entregue"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openWhatsAppPreview(o)} className="rounded-xl h-9">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(buildMessage(o)); toast({ title: "Copiado! 📋" }); }} className="rounded-xl h-9">
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicateOrder(o)} className="rounded-xl h-9">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteOrder(o.id)} className="rounded-xl h-9 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* WhatsApp Preview Dialog */}
      <Dialog open={!!whatsappPreview} onOpenChange={() => setWhatsappPreview(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📱 Pré-visualização da mensagem</DialogTitle>
            <p className="text-xs text-muted-foreground">Revise e edite antes de enviar</p>
          </DialogHeader>
          <Textarea value={whatsappPreview || ""} onChange={(e) => setWhatsappPreview(e.target.value)} className="min-h-[300px] rounded-xl text-sm" />
          <Button onClick={sendWhatsApp} className="w-full rounded-xl h-12 font-bold bg-success hover:bg-success/90 text-success-foreground gap-2">
            <MessageCircle className="w-5 h-5" /> Enviar no WhatsApp
          </Button>
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Encomenda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Client */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Cliente</label>
              {clients.length > 0 ? (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">Cadastre clientes primeiro</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Categoria do produto</label>
              <div className="flex flex-wrap gap-2">
                {orderCategories.map(c => (
                  <button key={c} onClick={() => setOrderCategory(c)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${orderCategory === c ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Tamanho" value={size} onChange={(e) => setSize(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Massa" value={dough} onChange={(e) => setDough(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Recheio" value={filling} onChange={(e) => setFilling(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Cobertura" value={topping} onChange={(e) => setTopping(e.target.value)} className="h-12 rounded-xl" />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold">Data de entrega</label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold">Horário</label>
                <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-12 rounded-xl" />
              </div>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Valor da encomenda (R$)</label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" placeholder="Digitar valor" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} className="h-12 rounded-xl flex-1" />
                {products.length > 0 && (
                  <Select onValueChange={(id) => { const p = products.find(pr => pr.id === id); if (p) setTotalValue(String(p.suggested_price || 0)); }}>
                    <SelectTrigger className="h-12 rounded-xl w-40"><SelectValue placeholder="Do produto" /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} - R$ {Number(p.suggested_price || 0).toFixed(2)}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Payment % */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Valor pago</label>
              <div className="grid grid-cols-3 gap-2">
                {["50", "100"].map(v => (
                  <button key={v} onClick={() => setPaymentPercent(v)}
                    className={`h-10 rounded-xl font-bold text-sm transition-all ${paymentPercent === v ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                    {v}%
                  </button>
                ))}
                <button onClick={() => setPaymentPercent("outro")}
                  className={`h-10 rounded-xl font-bold text-sm transition-all ${paymentPercent === "outro" ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                  Outro
                </button>
              </div>
              {paymentPercent === "outro" && <Input type="number" placeholder="%" value={customPercent} onChange={(e) => setCustomPercent(e.target.value)} className="h-10 rounded-xl" />}
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ v: "pix", l: "PIX", I: Smartphone }, { v: "credito", l: "Crédito", I: CreditCard }, { v: "debito", l: "Débito", I: CreditCard }].map(pm => (
                  <button key={pm.v} onClick={() => setPaymentMethod(pm.v)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === pm.v ? "bg-success/10 border-success text-success font-bold shadow-md" : "border-border bg-secondary/30 text-muted-foreground"}`}>
                    <pm.I className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{pm.l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Como será a entrega?</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ v: "pickup", l: "Retirada" }, { v: "delivery", l: "Entrega" }].map(d => (
                  <button key={d.v} onClick={() => setDeliveryType(d.v)}
                    className={`h-12 rounded-xl font-bold text-sm transition-all ${deliveryType === d.v ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                    {d.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional fees */}
            <div className="space-y-3">
              <label className="text-sm font-semibold">Taxas opcionais</label>
              {[
                { label: "Embalagem (R$)", state: feePackaging, setter: setFeePackaging },
                { label: "Topo de bolo (R$)", state: feeTopper, setter: setFeeTopper },
                { label: "Taxa decoração (R$)", state: feeDecoration, setter: setFeeDecoration },
                { label: "Taxa de entrega (R$)", state: feeDelivery, setter: setFeeDelivery },
                { label: "Taxa da maquininha (%)", state: feeCard, setter: setFeeCard },
              ].map(fee => (
                <div key={fee.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{fee.label}</span>
                    <Switch checked={fee.state.enabled} onCheckedChange={(v) => fee.setter({ ...fee.state, enabled: v })} />
                  </div>
                  {fee.state.enabled && <Input type="number" step="0.01" placeholder="0" value={fee.state.value} onChange={(e) => fee.setter({ ...fee.state, value: e.target.value })} className="h-10 rounded-xl mt-1" />}
                </div>
              ))}
            </div>

            {/* Observation */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Observação</label>
              <Textarea placeholder="Detalhes personalizados..." value={observation} onChange={(e) => setObservation(e.target.value)} className="rounded-xl" />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Status</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusLabels).map(([k, l]) => (
                  <button key={k} onClick={() => setStatus(k)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${status === k ? "bg-success text-success-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} className="w-full rounded-xl h-14 btn-3d font-bold gap-2 text-base">
              <ShoppingBag className="w-5 h-5" /> Criar Pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
