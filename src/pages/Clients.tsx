import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Phone } from "lucide-react";
import { mockClients } from "@/services/mockData";
import type { Client } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Clients = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");

  const resetForm = () => { setName(""); setPhone(""); setWhatsapp(""); setAddress(""); setEditing(null); };

  const openEdit = (c: Client) => {
    setEditing(c); setName(c.name); setPhone(c.phone); setWhatsapp(c.whatsapp); setAddress(c.address);
    setDialogOpen(true);
  };

  const save = () => {
    const client: Client = { id: editing?.id || crypto.randomUUID(), user_id: "u1", name, phone, whatsapp, address, created_at: editing?.created_at || new Date().toISOString() };
    if (editing) setClients(clients.map((c) => (c.id === editing.id ? client : c)));
    else setClients([...clients, client]);
    setDialogOpen(false); resetForm();
    toast({ title: editing ? "Cliente atualizado!" : "Cliente adicionado!" });
  };

  const remove = (id: string) => { setClients(clients.filter((c) => c.id !== id)); toast({ title: "Cliente excluído" }); };

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl" />
              <Input placeholder="WhatsApp (5511999999999)" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-11 rounded-xl" />
              <Input placeholder="Endereço" value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 rounded-xl" />
              <Button onClick={save} className="w-full h-11 rounded-xl" disabled={!name}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="border-border/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(c)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.phone}</p>
                </div>
                <div className="flex gap-1">
                  {c.whatsapp && (
                    <Button variant="ghost" size="icon" className="text-success hover:bg-success/10" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${c.whatsapp}`, "_blank"); }}>
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); remove(c.id); }}>
                    <Trash2 className="w-4 h-4" />
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
