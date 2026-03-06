import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Camera, Clock, MessageCircle, Link2, Plus, Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

const DigitalMenu = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [description, setDescription] = useState("");
  const [businessHours, setBusinessHours] = useState("");

  // Category form
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: prods }, { data: cats }, { data: menuSettings }] = await Promise.all([
        supabase.from("products").select("*").eq("user_id", user.id).order("name"),
        supabase.from("menu_categories").select("*").eq("user_id", user.id).order("sort_order"),
        supabase.from("menu_settings").select("*").eq("user_id", user.id).single(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      if (menuSettings) {
        setSettings(menuSettings);
        setDescription(menuSettings.description || "");
        setBusinessHours(menuSettings.business_hours || "");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    if (settings) {
      await supabase.from("menu_settings").update({ description, business_hours: businessHours }).eq("id", settings.id);
    } else {
      await supabase.from("menu_settings").insert({ user_id: user.id, description, business_hours: businessHours });
    }
    toast({ title: "Cardápio atualizado! ✅" });
  };

  const addCategory = async () => {
    if (!user || !newCatName.trim()) return;
    await supabase.from("menu_categories").insert({ user_id: user.id, name: newCatName.trim(), sort_order: categories.length });
    setNewCatName(""); setCatDialogOpen(false);
    toast({ title: "Categoria adicionada!" });
    const { data } = await supabase.from("menu_categories").select("*").eq("user_id", user.id).order("sort_order");
    setCategories(data || []);
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("menu_categories").delete().eq("id", id);
    setCategories(categories.filter(c => c.id !== id));
    toast({ title: "Categoria excluída" });
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`🍰 *Cardápio*\n\n${description}\n\n⏰ ${businessHours}\n\n${products.map(p => `• ${p.name} - R$ ${Number(p.suggested_price || 0).toFixed(2)}`).join("\n")}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const copyLink = () => {
    const text = `🍰 Cardápio\n\n${description}\n\n⏰ ${businessHours}\n\n${products.map(p => `• ${p.name} - R$ ${Number(p.suggested_price || 0).toFixed(2)}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Cardápio copiado! 📋" });
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-rose flex items-center justify-center mx-auto shadow-lg">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Cardápio Digital</h1>
        <p className="text-sm text-muted-foreground">Monte seu cardápio e compartilhe com seus clientes 📱</p>
      </div>

      {/* Cover & Logo placeholders */}
      <Card className="card-elevated overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-8 h-8 text-primary/40 mx-auto" />
            <p className="text-xs text-muted-foreground mt-1">Imagem de capa</p>
          </div>
        </div>
        <div className="-mt-10 flex justify-center">
          <div className="w-20 h-20 rounded-2xl border-4 border-card bg-secondary/50 flex items-center justify-center shadow-lg">
            <Camera className="w-6 h-6 text-primary/40" />
          </div>
        </div>
        <CardContent className="pt-2 pb-4 space-y-3 text-center">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Descrição do cardápio</label>
            <Input placeholder="Ex: Confeitaria artesanal com muito amor 💖" value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 rounded-xl text-center" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> Horário de funcionamento</label>
            <Input placeholder="Ex: Seg-Sex 8h às 18h" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className="h-12 rounded-xl text-center" />
          </div>
          <Button onClick={saveSettings} variant="outline" className="rounded-xl">Salvar configurações</Button>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">📂 Categorias</CardTitle>
            <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="rounded-xl gap-1 btn-3d"><Plus className="w-4 h-4" /> Nova</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
                <Input placeholder="Ex: Bolos decorados" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="h-12 rounded-xl" />
                <Button onClick={addCategory} className="w-full rounded-xl h-12 btn-3d font-bold">Adicionar</Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada ainda</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-full">
                  <span className="text-sm font-semibold text-secondary-foreground">{cat.name}</span>
                  <button onClick={() => deleteCategory(cat.id)} className="text-destructive/60 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products preview */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">🍰 Produtos no cardápio</CardTitle>
          <p className="text-xs text-muted-foreground">Os produtos vêm automaticamente da sua lista de produtos precificados</p>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <EmptyState icon={BookOpen} title="Nenhum produto ainda" description="Precifique seus produtos para que apareçam aqui automaticamente." />
          ) : (
            <div className="grid gap-3">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl">
                  <div className="w-16 h-16 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{p.name}</p>
                    {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                    <p className="text-sm font-extrabold text-primary mt-0.5">R$ {Number(p.suggested_price || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={shareWhatsApp} className="rounded-xl h-12 btn-3d bg-success hover:bg-success/90 text-success-foreground font-bold gap-2">
          <MessageCircle className="w-5 h-5" /> WhatsApp
        </Button>
        <Button onClick={copyLink} variant="outline" className="rounded-xl h-12 font-bold gap-2">
          <Link2 className="w-5 h-5" /> Copiar link
        </Button>
      </div>
    </div>
  );
};

export default DigitalMenu;
