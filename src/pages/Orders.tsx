import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingBag, MessageCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = { pending: "Pendente", production: "Em produção", delivered: "Entregue" };

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState("bolos");
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

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    const { error } = await supabase.from("orders").insert({
      user_id: user.id, category, size, filling, topping, dough,
      event_date: eventDate || null, delivery_type: deliveryType,
      payment_percent: Number(paymentPercent), payment_method: paymentMethod,
      total_value: Number(totalValue) || 0, notes, status: "pending",
    });
    if (error) { toast({ title: "Erro ao criar", variant: "destructive" }); return; }
    toast({ title: "Encomenda criada!" });
    setDialogOpen(false);
    fetchOrders();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
  };

  const sendWhatsApp = (order: any) => {
    const msg = encodeURIComponent(`✅ *Confirmação de Pedido*\n\nCategoria: ${order.category}\nData: ${order.event_date ? new Date(order.event_date).toLocaleDateString("pt-BR") : "A definir"}\nValor: R$ ${Number(order.total_value || 0).toFixed(2)}\n\n⚠️ Lembrando que o pedido será liberado somente após o pagamento de 100%.`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const filterByStatus = (status: string) => orders.filter((o) => o.status === status);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Encomendas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="rounded-xl">+ Nova encomenda</Button></DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova encomenda</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>{["bolos", "doces", "salgados"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Tamanho" value={size} onChange={(e) => setSize(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Massa" value={dough} onChange={(e) => setDough(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Recheio" value={filling} onChange={(e) => setFilling(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Cobertura" value={topping} onChange={(e) => setTopping(e.target.value)} className="h-12 rounded-xl" />
              <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-12 rounded-xl" />
              <Select value={deliveryType} onValueChange={setDeliveryType}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pickup">Retirada</SelectItem><SelectItem value="delivery">Entrega</SelectItem></SelectContent>
              </Select>
              <Select value={paymentPercent} onValueChange={setPaymentPercent}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="50">50%</SelectItem><SelectItem value="100">100%</SelectItem></SelectContent>
              </Select>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem></SelectContent>
              </Select>
              <Input type="number" placeholder="Valor total (R$)" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12 rounded-xl" />
              <Button onClick={handleCreate} className="w-full rounded-xl h-12">Criar encomenda</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pending">Pendentes ({filterByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="production">Produção ({filterByStatus("production").length})</TabsTrigger>
          <TabsTrigger value="delivered">Entregues ({filterByStatus("delivered").length})</TabsTrigger>
        </TabsList>
        {["pending", "production", "delivered"].map((status) => (
          <TabsContent key={status} value={status}>
            {filterByStatus(status).length === 0 ? (
              <EmptyState icon={ShoppingBag} title={`Nenhuma encomenda ${statusLabels[status]?.toLowerCase()}`} description="Suas encomendas aparecerão aqui." />
            ) : (
              <div className="grid gap-3 mt-4">
                {filterByStatus(status).map((o) => (
                  <Card key={o.id}><CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground capitalize">{o.category}</p>
                        {o.size && <p className="text-sm text-muted-foreground">Tamanho: {o.size}</p>}
                        {o.filling && <p className="text-sm text-muted-foreground">Recheio: {o.filling}</p>}
                        <p className="text-sm text-primary font-bold mt-1">R$ {Number(o.total_value || 0).toFixed(2)}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => sendWhatsApp(o)}><MessageCircle className="w-4 h-4 text-success" /></Button>
                    </div>
                    <div className="flex gap-2">
                      {status === "pending" && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "production")} className="rounded-xl text-xs">Iniciar produção</Button>}
                      {status === "production" && <Button size="sm" variant="outline" onClick={() => updateStatus(o.id, "delivered")} className="rounded-xl text-xs">Marcar entregue</Button>}
                    </div>
                  </CardContent></Card>
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
