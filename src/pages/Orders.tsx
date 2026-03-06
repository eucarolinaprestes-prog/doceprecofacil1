import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ShoppingBag, MessageCircle, Link2, Trash2, Copy, Pencil, CreditCard, Smartphone } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = { pending: "Pendente", production: "Em Produção", delivered: "Entregue" };
const statusColors: Record<string, string> = { pending: "bg-warning/10 text-warning", production: "bg-primary/10 text-primary", delivered: "bg-success/10 text-success" };
const orderCategories = ["Bolos", "Doces", "Salgados", "Cupcakes", "Fatias", "Outros"];

const paymentOptions = [
  { value: "pix", label: "Pix", icon: Smartphone, color: "bg-success/10 border-success/30 text-success" },
  { value: "credito", label: "Crédito", icon: CreditCard, color: "bg-primary/10 border-primary/30 text-primary" },
  { value: "debito", label: "Débito", icon: CreditCard, color: "bg-accent/10 border-accent/30 text-accent" },
];

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [clientId, setClientId] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [filling, setFilling] = useState("");
  const [topping, setTopping] = useState("");
  const [dough, setDough] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [paymentPercent, setPaymentPercent] = useState("100");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [totalValue, setTotalValue] = useState("");
  const [notes, setNotes] = useState("");

  // Optional fees
  const [cardFeeEnabled, setCardFeeEnabled] = useState(false);
  const [cardFeeValue, setCardFeeValue] = useState("3");
  const [decoFeeEnabled, setDecoFeeEnabled] = useState(false);
  const [decoFeeValue, setDecoFeeValue] = useState("");
  const [packFeeEnabled, setPackFeeEnabled] = useState(false);
  const [packFeeValue, setPackFeeValue] = useState("");
  const [topperFeeEnabled, setTopperFeeEnabled] = useState(false);
  const [topperFeeValue, setTopperFeeValue] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: ord }, { data: cli }] = await Promise.all([
      supabase.from("orders").select("*, clients(name, whatsapp)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("user_id", user.id).order("name"),
    ]);
    setOrders(ord || []);
    setClients(cli || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    const extras = [
      cardFeeEnabled ? Number(cardFeeValue) || 0 : 0,
      decoFeeEnabled ? Number(decoFeeValue) || 0 : 0,
      packFeeEnabled ? Number(packFeeValue) || 0 : 0,
      topperFeeEnabled ? Number(topperFeeValue) || 0 : 0,
    ].reduce((a, b) => a + b, 0);

    const { error } = await supabase.from("orders").insert({
      user_id: user.id, client_id: clientId || null, category, size, filling, topping, dough,
      event_date: eventDate || null, delivery_type: deliveryType,
      payment_percent: Number(paymentPercent), payment_method: paymentMethod,
      total_value: (Number(totalValue) || 0) + extras, notes, status: "pending",
    });
    if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
    toast({ title: "Encomenda criada! 🎉" });
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setClientId(""); setCategory(""); setSize(""); setFilling(""); setTopping("");
    setDough(""); setEventDate(""); setTotalValue(""); setNotes("");
    setCardFeeEnabled(false); setDecoFeeEnabled(false); setPackFeeEnabled(false); setTopperFeeEnabled(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchData();
  };

  const deleteOrder = async (id: string) => {
    await supabase.from("orders").delete().eq("id", id);
    toast({ title: "Encomenda excluída" });
    fetchData();
  };

  const duplicateOrder = async (order: any) => {
    const { id, created_at, updated_at, clients: _, ...rest } = order;
    await supabase.from("orders").insert({ ...rest, status: "pending" });
    toast({ title: "Encomenda duplicada! ✅" });
    fetchData();
  };

  const buildMessage = (order: any) => {
    const clientName = order.clients?.name || "Cliente";
    return `✅ *Confirmação de Pedido*\n\n👤 Cliente: ${clientName}\n📋 Categoria: ${order.category}\n📅 Data: ${order.event_date ? new Date(order.event_date).toLocaleDateString("pt-BR") : "A definir"}\n💰 Valor: R$ ${Number(order.total_value || 0).toFixed(2)}\n💳 Pagamento: ${order.payment_method}\n\n${order.notes ? `📝 Obs: ${order.notes}\n\n` : ""}⚠️ Pedido liberado após confirmação do pagamento.`;
  };

  const sendWhatsApp = (order: any) => {
    const phone = order.clients?.whatsapp?.replace(/\D/g, "") || "";
    const msg = encodeURIComponent(buildMessage(order));
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const shareLink = (order: any) => {
    const text = buildMessage(order);
    navigator.clipboard.writeText(text);
    toast({ title: "Texto copiado! Cole onde quiser 📋" });
  };

  const filterByStatus = (status: string) => orders.filter((o) => o.status === status);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-rose flex items-center justify-center mx-auto shadow-lg">
          <ShoppingBag className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Suas Encomendas</h1>
        <p className="text-sm text-muted-foreground">Gerencie todos os seus pedidos em um só lugar 📦</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full rounded-xl h-12 btn-3d font-bold gap-2">+ Nova Encomenda</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Encomenda</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {clients.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Cliente</label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione o cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Categoria</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{orderCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Input placeholder="Tamanho" value={size} onChange={(e) => setSize(e.target.value)} className="h-12 rounded-xl" />
            <Input placeholder="Massa" value={dough} onChange={(e) => setDough(e.target.value)} className="h-12 rounded-xl" />
            <Input placeholder="Recheio" value={filling} onChange={(e) => setFilling(e.target.value)} className="h-12 rounded-xl" />
            <Input placeholder="Cobertura" value={topping} onChange={(e) => setTopping(e.target.value)} className="h-12 rounded-xl" />
            <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-12 rounded-xl" />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Como vai receber?</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentOptions.map(pm => (
                  <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${paymentMethod === pm.value ? pm.color + " border-current font-bold shadow-md" : "border-border bg-secondary/30 text-muted-foreground"}`}
                    style={paymentMethod === pm.value ? { boxShadow: "0 3px 0 0 currentColor" } : {}}>
                    <pm.icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input type="number" placeholder="Valor total (R$)" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} className="h-12 rounded-xl text-lg font-bold" />

            <p className="text-xs font-bold text-foreground mt-2">Taxas opcionais</p>
            <div className="space-y-2">
              {[
                { label: "Taxa da maquininha (%)", enabled: cardFeeEnabled, setEnabled: setCardFeeEnabled, value: cardFeeValue, setValue: setCardFeeValue, suffix: "%" },
                { label: "Taxa de decoração (R$)", enabled: decoFeeEnabled, setEnabled: setDecoFeeEnabled, value: decoFeeValue, setValue: setDecoFeeValue, suffix: "R$" },
                { label: "Taxa de embalagem (R$)", enabled: packFeeEnabled, setEnabled: setPackFeeEnabled, value: packFeeValue, setValue: setPackFeeValue, suffix: "R$" },
                { label: "Taxa topo de bolo (R$)", enabled: topperFeeEnabled, setEnabled: setTopperFeeEnabled, value: topperFeeValue, setValue: setTopperFeeValue, suffix: "R$" },
              ].map(fee => (
                <div key={fee.label} className="flex items-center justify-between bg-secondary/40 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Switch checked={fee.enabled} onCheckedChange={fee.setEnabled} />
                    <span className="text-xs font-medium">{fee.label}</span>
                  </div>
                  {fee.enabled && <Input type="number" value={fee.value} onChange={(e) => fee.setValue(e.target.value)} className="w-20 h-8 rounded-lg text-sm text-center" />}
                </div>
              ))}
            </div>

            <Input placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12 rounded-xl" />
            <Button onClick={handleCreate} className="w-full rounded-xl h-12 btn-3d font-bold">Criar Encomenda</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-3 w-full h-12 rounded-xl">
          <TabsTrigger value="pending" className="rounded-xl text-xs font-bold">Pendentes ({filterByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="production" className="rounded-xl text-xs font-bold">Produção ({filterByStatus("production").length})</TabsTrigger>
          <TabsTrigger value="delivered" className="rounded-xl text-xs font-bold">Entregues ({filterByStatus("delivered").length})</TabsTrigger>
        </TabsList>
        {["pending", "production", "delivered"].map((status) => (
          <TabsContent key={status} value={status}>
            {filterByStatus(status).length === 0 ? (
              <EmptyState icon={ShoppingBag} title={`Nenhuma encomenda ${statusLabels[status]?.toLowerCase()}`} description="Suas encomendas aparecerão aqui." />
            ) : (
              <div className="grid gap-3 mt-4">
                {filterByStatus(status).map((o) => (
                  <Card key={o.id} className="card-elevated overflow-hidden">
                    <div className={`h-1.5 ${status === "pending" ? "bg-warning" : status === "production" ? "bg-primary" : "bg-success"}`} />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-foreground text-lg capitalize">{o.category}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusColors[status]}`}>{statusLabels[status]}</span>
                          {o.clients?.name && <p className="text-sm text-muted-foreground mt-1">👤 {o.clients.name}</p>}
                          {o.filling && <p className="text-xs text-muted-foreground">Recheio: {o.filling}</p>}
                          {o.event_date && <p className="text-xs text-muted-foreground">📅 {new Date(o.event_date).toLocaleDateString("pt-BR")}</p>}
                        </div>
                        <p className="text-xl font-extrabold text-primary">R$ {Number(o.total_value || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {status === "pending" && <Button size="sm" onClick={() => updateStatus(o.id, "production")} className="rounded-xl text-xs btn-3d flex-1">Iniciar produção</Button>}
                        {status === "production" && <Button size="sm" onClick={() => updateStatus(o.id, "delivered")} className="rounded-xl text-xs bg-success hover:bg-success/90 text-success-foreground flex-1">Marcar entregue</Button>}
                        <Button size="sm" variant="outline" onClick={() => sendWhatsApp(o)} className="rounded-xl text-xs gap-1"><MessageCircle className="w-3.5 h-3.5 text-success" /></Button>
                        <Button size="sm" variant="outline" onClick={() => shareLink(o)} className="rounded-xl text-xs gap-1"><Link2 className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => duplicateOrder(o)} className="rounded-xl text-xs"><Copy className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => deleteOrder(o.id)} className="rounded-xl text-xs text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Orders;
