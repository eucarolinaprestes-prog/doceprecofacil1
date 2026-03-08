import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cake, Trash2, ChevronLeft, CreditCard, Smartphone, Pencil } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);


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
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [whatsappPreview, setWhatsappPreview] = useState<string | null>(null);
  const [whatsappOrder, setWhatsappOrder] = useState<any>(null);

  // Form
  const [clientId, setClientId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [status, setStatus] = useState("pending");
  const [orderCategory, setOrderCategory] = useState("");
  const [customOrderCategory, setCustomOrderCategory] = useState("");
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

  const handleSave = async () => {
    if (!user) return;
    const data = {
      user_id: user.id,
      client_id: clientId || null,
      event_date: eventDate || null,
      status,
      payment_percent: paidPercent,
      payment_method: paymentMethod,
      total_value: finalValue,
      notes,
      category: orderCategory === "Outros" && customOrderCategory.trim() ? customOrderCategory.trim() : orderCategory,
      size, filling, topping, dough,
      delivery_type: deliveryType,
      observation,
      fee_packaging: feePackaging.enabled ? Number(feePackaging.value) || 0 : 0,
      fee_topper: feeTopper.enabled ? Number(feeTopper.value) || 0 : 0,
      fee_decoration: feeDecoration.enabled ? Number(feeDecoration.value) || 0 : 0,
      fee_delivery: feeDelivery.enabled ? Number(feeDelivery.value) || 0 : 0,
      fee_card_percent: cardPercent,
    };

    let error;
    if (editingOrder) {
      ({ error } = await supabase.from("orders").update(data).eq("id", editingOrder.id));
    } else {
      ({ error } = await supabase.from("orders").insert(data));
    }
    if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
    toast({ title: editingOrder ? "Encomenda atualizada! ✅" : "Encomenda criada! 🎉" });
    setDialogOpen(false);
    setEditingOrder(null);
    resetForm();
    fetchData();
  };

  const openEditDialog = (o: any) => {
    setEditingOrder(o);
    setClientId(o.client_id || "");
    setEventDate(o.event_date ? o.event_date.split("T")[0] : "");
    setEventTime(o.event_date && o.event_date.includes("T") ? o.event_date.split("T")[1]?.substring(0, 5) : "");
    setStatus(o.status || "pending");
    setOrderCategory(o.category || "");
    setSize(o.size || "");
    setDough(o.dough || "");
    setFilling(o.filling || "");
    setTopping(o.topping || "");
    setTotalValue(String(o.total_value || ""));
    setPaymentPercent(String(o.payment_percent || "100"));
    setPaymentMethod(o.payment_method || "pix");
    setDeliveryType(o.delivery_type || "pickup");
    setNotes(o.notes || "");
    setObservation(o.observation || "");
    setFeePackaging({ enabled: !!o.fee_packaging, value: String(o.fee_packaging || "") });
    setFeeTopper({ enabled: !!o.fee_topper, value: String(o.fee_topper || "") });
    setFeeDecoration({ enabled: !!o.fee_decoration, value: String(o.fee_decoration || "") });
    setFeeDelivery({ enabled: !!o.fee_delivery, value: String(o.fee_delivery || "") });
    setFeeCard({ enabled: !!o.fee_card_percent, value: String(o.fee_card_percent || "") });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setClientId(""); setEventDate(""); setEventTime(""); setStatus("pending");
    setOrderCategory(""); setCustomOrderCategory(""); setSize(""); setDough(""); setFilling(""); setTopping("");
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


  const buildMessage = (order: any) => {
    const clientName = order.clients?.name || "Cliente";
    const clientAddr = order.clients?.address || "";
    const confAddr = profile?.address || "";
    const storeName = profile?.store_name || "nossa confeitaria";
    const dateStr = order.event_date ? new Date(order.event_date).toLocaleDateString("pt-BR") : "a definir";
    const timeStr = order.event_date && order.event_date.includes("T") ? new Date(order.event_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
    const total = Number(order.total_value || 0);
    const totalStr = `R$ ${total.toFixed(2)}`;
    const paidPercent = Number(order.payment_percent || 100);
    const paidValue = total * (paidPercent / 100);
    const remainingValue = total - paidValue;
    const remainingPercent = 100 - paidPercent;

    // Extras/fees detail
    const extras = [];
    if (Number(order.fee_packaging || 0) > 0) extras.push(`• Embalagem: R$ ${Number(order.fee_packaging).toFixed(2)}`);
    if (Number(order.fee_topper || 0) > 0) extras.push(`• Topo de bolo: R$ ${Number(order.fee_topper).toFixed(2)}`);
    if (Number(order.fee_decoration || 0) > 0) extras.push(`• Decoração: R$ ${Number(order.fee_decoration).toFixed(2)}`);
    if (Number(order.fee_delivery || 0) > 0) extras.push(`• Taxa de entrega: R$ ${Number(order.fee_delivery).toFixed(2)}`);
    if (Number(order.fee_card_percent || 0) > 0) extras.push(`• Taxa da maquininha: ${Number(order.fee_card_percent)}%`);
    const extrasStr = extras.length > 0 ? `\n\n🧾 *Taxas adicionais:*\n${extras.join("\n")}` : "";

    const details = [];
    if (order.category) details.push(`📋 *Produto:* ${order.category}`);
    if (order.size) details.push(`📏 *Tamanho:* ${order.size}`);
    if (order.dough) details.push(`🍞 *Massa:* ${order.dough}`);
    if (order.filling) details.push(`🍰 *Recheio:* ${order.filling}`);
    if (order.topping) details.push(`🎨 *Cobertura:* ${order.topping}`);
    if (order.observation) details.push(`📝 *Observação:* ${order.observation}`);
    details.push(`📅 *Data:* ${dateStr}${timeStr ? ` às ${timeStr}` : ""}`);
    details.push(`💰 *Valor total:* ${totalStr}`);
    details.push(`💳 *Forma de pagamento:* ${order.payment_method?.toUpperCase() || "PIX"}`);
    const detailsStr = details.join("\n");

    // Payment info
    let paymentInfo = "";
    if (paidPercent < 100 && paidPercent > 0) {
      paymentInfo = `\n\n💵 *Pagamento:*\n`;
      paymentInfo += `✅ Valor pago (${paidPercent}%): *R$ ${paidValue.toFixed(2)}*\n`;
      paymentInfo += `⏳ Valor restante (${remainingPercent}%): *R$ ${remainingValue.toFixed(2)}*\n`;
      paymentInfo += `\n⚠️ *O produto só será entregue após o pagamento total do pedido.*`;
    }

    // Delivery info
    let deliveryInfo = "";
    if (order.delivery_type === "pickup" && confAddr) {
      deliveryInfo = `\n\n📍 *Retirada no endereço:*\n${confAddr}`;
      if (timeStr) deliveryInfo += `\n🕐 *Horário para retirada:* até ${timeStr}`;
    } else if (order.delivery_type === "delivery" && clientAddr) {
      deliveryInfo = `\n\n📍 *O pedido será entregue no endereço:*\n${clientAddr}`;
      if (timeStr) deliveryInfo += `\n🕐 *Previsão de entrega:* ${timeStr}`;
    }

    // === PENDENTE / ORÇAMENTO ===
    if (order.status === "pending" || order.status === "scheduled") {
      let msg = `Olá, ${clientName}! 😊\n\n`;
      msg += `Tudo bem com você? Segue o orçamento detalhado do seu pedido:\n\n`;
      msg += detailsStr;
      msg += extrasStr;
      msg += paymentInfo;
      msg += deliveryInfo;
      msg += `\n\nAssim que confirmar, me envia o comprovante de pagamento para eu agendar a produção, tá? 💕`;
      msg += `\n\nQualquer dúvida, estou à disposição! 🙏`;
      return msg;
    }

    // === EM PRODUÇÃO / AGENDADO ===
    if (order.status === "production") {
      let msg = `Olá, ${clientName}! 😊\n\n`;
      msg += `Ótima notícia! Seu pedido foi confirmado e já está em produção! 🎉\n\n`;
      msg += `Confira os detalhes:\n\n`;
      msg += detailsStr;
      msg += extrasStr;
      msg += paymentInfo;
      msg += deliveryInfo;
      msg += `\n\nEstou preparando tudo com muito carinho e capricho pra você! 💕`;
      msg += `\n\nQualquer novidade, te aviso por aqui! 😘`;
      return msg;
    }

    // === FINALIZADO ===
    if (order.status === "finished") {
      let msg = `Olá, ${clientName}! 😊\n\n`;
      msg += `Que alegria te avisar que seu pedido ficou pronto! Foi feito com muito amor e carinho especialmente pra você! ✨🎂\n\n`;
      msg += detailsStr;
      msg += extrasStr;
      if (paidPercent < 100) {
        msg += `\n\n💵 *Sobre o pagamento:*\n`;
        msg += `Lembrando que o valor restante de *R$ ${remainingValue.toFixed(2)}* deve ser pago no momento da ${order.delivery_type === "pickup" ? "retirada" : "entrega"}, tá? 😉`;
      }
      msg += deliveryInfo;
      msg += `\n\n🚗 *Dicas importantes para o transporte:*\n`;
      msg += `• Transportar sempre em superfície plana\n`;
      msg += `• Evitar sol e calor\n`;
      msg += `• Não colocar objetos sobre a caixa\n`;
      msg += `• Manter refrigerado se necessário\n`;
      msg += `\n⚠️ *Após a retirada ou entrega, não nos responsabilizamos por danos causados durante transporte inadequado ou armazenamento incorreto.*`;
      msg += `\n\nMal posso esperar pra você ver! 😍`;
      return msg;
    }

    // === ENTREGUE ===
    if (order.status === "delivered") {
      let msg = `Olá, ${clientName}! 😊\n\n`;
      msg += `Espero que você tenha amado o seu pedido! Foi preparado com muito carinho e dedicação! 💕✨\n\n`;
      msg += `Muito obrigada pela confiança em escolher a ${storeName}! Fico muito feliz em fazer parte desse momento especial! 🥰\n\n`;
      msg += `Se puder, me manda uma foto? Adoraria ver como ficou na sua mesa! 📸\n\n`;
      msg += `E quando precisar novamente, estou por aqui! Será um prazer te atender sempre! 🎂💖\n\n`;
      msg += `Um grande abraço! 🤗`;
      return msg;
    }

    // Fallback
    let msg = `Olá, ${clientName}! 😊\n\n`;
    msg += detailsStr;
    msg += extrasStr;
    msg += paymentInfo;
    msg += deliveryInfo;
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
          <Cake className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Encomendas</h1>
        <p className="text-sm text-muted-foreground">Gerencie todos os seus pedidos em um só lugar</p>
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
        <EmptyState icon={Cake} title="Nenhuma encomenda" description="Crie sua primeira encomenda." />
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
                  <Button size="sm" variant="outline" onClick={() => openWhatsAppPreview(o)} className="rounded-xl h-9 text-success border-success/30 hover:bg-success/10">
                    <WhatsAppIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(o)} className="rounded-xl h-9">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteOrder(o.id)} className="rounded-xl h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* WhatsApp Preview Dialog */}
      <Dialog open={!!whatsappPreview} onOpenChange={() => { setWhatsappPreview(null); setWhatsappOrder(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📱 Prévia da mensagem</DialogTitle>
            <p className="text-xs text-muted-foreground">Revise e edite antes de enviar pelo WhatsApp</p>
          </DialogHeader>
          <Textarea value={whatsappPreview || ""} onChange={(e) => setWhatsappPreview(e.target.value)} className="min-h-[300px] rounded-xl text-sm" />
          <Button onClick={sendWhatsApp} className="w-full rounded-xl h-12 font-bold bg-success hover:bg-success/90 text-success-foreground gap-2">
            <WhatsAppIcon className="w-5 h-5" /> Enviar no WhatsApp
          </Button>
        </DialogContent>
      </Dialog>


      {/* Order Dialog (Create / Edit) */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditingOrder(null); resetForm(); } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Editar Encomenda" : "Nova Encomenda"}</DialogTitle>
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
              {orderCategory === "Outros" && (
                <Input placeholder="Especifique a categoria..." value={customOrderCategory} onChange={(e) => setCustomOrderCategory(e.target.value)} className="h-12 rounded-xl mt-2" />
              )}
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
                <label className="text-sm font-semibold flex items-center gap-1.5">📅 Data de entrega</label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} 
                  className="h-12 rounded-xl border-2 border-primary/20 bg-primary/5 font-semibold text-foreground focus:border-primary focus:ring-primary/20 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded-lg [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:hover:bg-primary/10" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-1.5">🕐 Horário</label>
                <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} 
                  className="h-12 rounded-xl border-2 border-primary/20 bg-primary/5 font-semibold text-foreground focus:border-primary focus:ring-primary/20 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded-lg [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:hover:bg-primary/10" />
              </div>
            </div>

            {/* Value */}
            <div className="space-y-1">
              <label className="text-sm font-semibold">Valor da encomenda (R$)</label>
              <div className="flex gap-2">
                <CurrencyInput placeholder="Digitar valor" value={totalValue} onValueChange={setTotalValue} className="h-12 rounded-xl flex-1" />
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
                  {fee.state.enabled && <CurrencyInput placeholder="0" value={fee.state.value} onValueChange={(v) => fee.setter({ ...fee.state, value: v })} className="h-10 rounded-xl mt-1" />}
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

            <Button onClick={handleSave} className="w-full rounded-xl h-14 btn-3d font-bold gap-2 text-base">
              <Cake className="w-5 h-5" /> {editingOrder ? "Salvar Alterações" : "Criar Pedido"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
