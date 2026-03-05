import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Trash2, MessageCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const Clients = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase.from("clients").select("*").eq("user_id", user.id).order("name");
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, [user]);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("clients").insert({ user_id: user.id, name: name.trim(), whatsapp, address });
    if (error) { toast({ title: "Erro", variant: "destructive" }); return; }
    toast({ title: "Cliente adicionado!" });
    setDialogOpen(false);
    setName(""); setWhatsapp(""); setAddress("");
    fetchClients();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    toast({ title: "Cliente excluído" });
    fetchClients();
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="rounded-xl">+ Novo cliente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl" />
              <Button onClick={handleCreate} className="w-full rounded-xl h-12">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente cadastrado" description="Adicione seus clientes para organizar suas encomendas." actionLabel="Adicionar cliente" onAction={() => setDialogOpen(true)} />
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{c.name}</p>
                  {c.whatsapp && <p className="text-sm text-muted-foreground">{c.whatsapp}</p>}
                  {c.address && <p className="text-sm text-muted-foreground">{c.address}</p>}
                </div>
                <div className="flex gap-1">
                  {c.whatsapp && (
                    <Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`, "_blank")}>
                      <MessageCircle className="w-4 h-4 text-success" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
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

export default Clients;
