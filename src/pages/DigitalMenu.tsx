import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Camera, Clock, MessageCircle, Link2, Plus, Trash2, Pencil, Eye,
  Star, Copy, GripVertical, Share2, Palette, Upload, ExternalLink, Sparkles,
  ShoppingBag
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/hooks/use-toast";

interface MenuProduct {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  status: string;
  featured: boolean;
  available_today: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface MenuCategory {
  id: string;
  user_id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
}

interface MenuSettings {
  id: string;
  user_id: string;
  description: string | null;
  business_hours: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  store_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  button_color: string;
  showcase_mode: boolean;
}

const DEFAULT_SETTINGS: Partial<MenuSettings> = {
  store_name: "",
  tagline: "",
  description: "",
  business_hours: "",
  logo_url: "",
  cover_photo_url: "",
  primary_color: "#e91e7b",
  secondary_color: "#f8bbd0",
  button_color: "#e91e7b",
  showcase_mode: false,
};

const DigitalMenu = () => {
  const { user, profile, businessId } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [settings, setSettings] = useState<MenuSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"config" | "categories" | "products" | "preview">("config");

  // Settings form
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#e91e7b");
  const [secondaryColor, setSecondaryColor] = useState("#f8bbd0");
  const [buttonColor, setButtonColor] = useState("#e91e7b");
  const [showcaseMode, setShowcaseMode] = useState(false);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState("");

  // Product dialog
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [editProdId, setEditProdId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCatId, setProdCatId] = useState("");
  const [prodStatus, setProdStatus] = useState("disponivel");
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodAvailableToday, setProdAvailableToday] = useState(false);
  const [prodPhotoUrl, setProdPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    const [{ data: prods }, { data: cats }, { data: ms }] = await Promise.all([
      (supabase.from("menu_products") as any).select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("menu_categories").select("*").eq("user_id", user.id).order("sort_order"),
      (supabase.from("menu_settings") as any).select("*").eq("user_id", user.id).single(),
    ]);
    setProducts(prods || []);
    setCategories(cats || []);
    if (ms) {
      setSettings(ms);
      setStoreName(ms.store_name || profile?.store_name || "");
      setTagline(ms.tagline || "");
      setDescription(ms.description || "");
      setBusinessHours(ms.business_hours || "");
      setPrimaryColor(ms.primary_color || "#e91e7b");
      setSecondaryColor(ms.secondary_color || "#f8bbd0");
      setButtonColor(ms.button_color || "#e91e7b");
      setShowcaseMode(ms.showcase_mode || false);
      setCoverPhotoUrl(ms.cover_photo_url || "");
      setLogoUrl(ms.logo_url || "");
    } else {
      setStoreName(profile?.store_name || "");
    }
    setLoading(false);
  }, [user, profile]);

  useEffect(() => { reload(); }, [reload]);

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user!.id}/${path}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e: any) {
      toast({ title: "Erro ao enviar imagem", description: e.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // ---- SETTINGS ----
  const saveSettings = async () => {
    if (!user) return;
    const payload: any = {
      store_name: storeName,
      tagline,
      description,
      business_hours: businessHours,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      button_color: buttonColor,
      showcase_mode: showcaseMode,
      logo_url: logoUrl,
      cover_photo_url: coverPhotoUrl,
    };
    if (settings) {
      await (supabase.from("menu_settings") as any).update(payload).eq("id", settings.id);
    } else {
      await (supabase.from("menu_settings") as any).insert({ ...payload, user_id: user.id, business_id: businessId });
    }
    toast({ title: "Configurações salvas! ✅" });
    reload();
  };

  // ---- CATEGORIES ----
  const openNewCat = () => { setEditCatId(null); setCatName(""); setCatDialogOpen(true); };
  const openEditCat = (cat: MenuCategory) => { setEditCatId(cat.id); setCatName(cat.name); setCatDialogOpen(true); };
  const saveCat = async () => {
    if (!user || !catName.trim()) return;
    if (editCatId) {
      await supabase.from("menu_categories").update({ name: catName.trim() }).eq("id", editCatId);
    } else {
      await supabase.from("menu_categories").insert({ user_id: user.id, business_id: businessId, name: catName.trim(), sort_order: categories.length } as any);
    }
    setCatDialogOpen(false);
    toast({ title: editCatId ? "Categoria atualizada!" : "Categoria adicionada!" });
    reload();
  };
  const deleteCat = async (id: string) => {
    await supabase.from("menu_categories").delete().eq("id", id);
    toast({ title: "Categoria excluída" });
    reload();
  };

  // ---- PRODUCTS ----
  const resetProdForm = () => {
    setEditProdId(null); setProdName(""); setProdDesc(""); setProdPrice("");
    setProdCatId(""); setProdStatus("disponivel"); setProdFeatured(false);
    setProdAvailableToday(false); setProdPhotoUrl("");
  };
  const openNewProd = () => { resetProdForm(); setProdDialogOpen(true); };
  const openEditProd = (p: MenuProduct) => {
    setEditProdId(p.id); setProdName(p.name); setProdDesc(p.description || "");
    setProdPrice(String(p.price)); setProdCatId(p.category_id || "");
    setProdStatus(p.status); setProdFeatured(p.featured); setProdAvailableToday(p.available_today);
    setProdPhotoUrl(p.photo_url || ""); setProdDialogOpen(true);
  };
  const saveProd = async () => {
    if (!user || !prodName.trim()) return;
    const payload: any = {
      name: prodName.trim(),
      description: prodDesc,
      price: parseFloat(prodPrice) || 0,
      category_id: prodCatId || null,
      status: prodStatus,
      featured: prodFeatured,
      available_today: prodAvailableToday,
      photo_url: prodPhotoUrl,
    };
    if (editProdId) {
      await (supabase.from("menu_products") as any).update(payload).eq("id", editProdId);
    } else {
      await (supabase.from("menu_products") as any).insert({ ...payload, user_id: user.id, sort_order: products.length });
    }
    setProdDialogOpen(false);
    toast({ title: editProdId ? "Produto atualizado!" : "Produto adicionado!" });
    reload();
  };
  const deleteProd = async (id: string) => {
    await (supabase.from("menu_products") as any).delete().eq("id", id);
    toast({ title: "Produto excluído" });
    reload();
  };
  const duplicateProd = async (p: MenuProduct) => {
    await (supabase.from("menu_products") as any).insert({
      user_id: user!.id, name: `${p.name} (cópia)`, description: p.description,
      price: p.price, category_id: p.category_id, status: p.status,
      featured: p.featured, available_today: p.available_today, photo_url: p.photo_url,
      sort_order: products.length,
    });
    toast({ title: "Produto duplicado!" });
    reload();
  };
  const toggleFeatured = async (p: MenuProduct) => {
    await (supabase.from("menu_products") as any).update({ featured: !p.featured }).eq("id", p.id);
    reload();
  };
  const toggleAvailableToday = async (p: MenuProduct) => {
    await (supabase.from("menu_products") as any).update({ available_today: !p.available_today }).eq("id", p.id);
    reload();
  };

  // ---- SHARE ----
  const menuUrl = `${window.location.origin}/cardapio/${user?.id}`;
  const shareWhatsApp = () => {
    const msg = encodeURIComponent(`🍰 Confira meu cardápio!\n\n${menuUrl}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };
  const copyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({ title: "Link copiado! 📋" });
  };

  const statusLabel = (s: string) => {
    if (s === "disponivel") return { text: "Disponível", color: "bg-green-100 text-green-700" };
    if (s === "sob_encomenda") return { text: "Sob encomenda", color: "bg-yellow-100 text-yellow-700" };
    return { text: "Esgotado", color: "bg-red-100 text-red-700" };
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  const tabs = [
    { key: "config", label: "⚙️ Config", icon: Palette },
    { key: "categories", label: "📂 Categorias", icon: BookOpen },
    { key: "products", label: "🍰 Produtos", icon: ShoppingBag },
    { key: "preview", label: "👁 Prévia", icon: Eye },
  ] as const;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-rose flex items-center justify-center mx-auto shadow-lg">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Cardápio Digital</h1>
        <p className="text-sm text-muted-foreground">Crie seu cardápio e compartilhe com clientes 📱</p>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={shareWhatsApp} className="rounded-xl h-11 bg-success hover:bg-success/90 text-success-foreground font-bold gap-2 text-sm">
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </Button>
        <Button onClick={copyLink} variant="outline" className="rounded-xl h-11 font-bold gap-2 text-sm">
          <Link2 className="w-4 h-4" /> Copiar link
        </Button>
      </div>

      {/* Preview link */}
      <Button variant="outline" className="w-full rounded-xl h-11 gap-2 text-sm" onClick={() => window.open(menuUrl, "_blank")}>
        <ExternalLink className="w-4 h-4" /> Ver cardápio público
      </Button>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${activeTab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Config */}
      {activeTab === "config" && (
        <div className="space-y-4">
          <Card className="card-elevated overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">🎨 Aparência do Cardápio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover photo */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Foto de capa</Label>
                {coverPhotoUrl && <img src={coverPhotoUrl} alt="Capa" className="w-full h-32 object-cover rounded-xl" />}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                    <span><Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Enviar foto de capa"}</span>
                  </Button>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const url = await uploadImage(f, "cover");
                    if (url) setCoverPhotoUrl(url);
                  }} />
                </label>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Logo</Label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                      <span><Upload className="w-4 h-4" /> Logo</span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const url = await uploadImage(f, "logo");
                      if (url) setLogoUrl(url);
                    }} />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Nome da confeitaria</Label>
                <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Ex: Doces da Carol" className="h-11 rounded-xl" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Frase de apresentação</Label>
                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Ex: Feito com carinho para adoçar seu dia 🍰" className="h-11 rounded-xl" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">Descrição</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Sobre sua confeitaria..." className="rounded-xl" rows={2} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Horário de funcionamento</Label>
                <Input value={businessHours} onChange={e => setBusinessHours(e.target.value)} placeholder="Ex: Seg-Sex 8h às 18h" className="h-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2"><Palette className="w-4 h-4" /> Cores do cardápio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Principal</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <span className="text-xs text-muted-foreground">{primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <span className="text-xs text-muted-foreground">{secondaryColor}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-muted-foreground">Botões</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={buttonColor} onChange={e => setButtonColor(e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <span className="text-xs text-muted-foreground">{buttonColor}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1"><Sparkles className="w-4 h-4" /> Modo Vitrine</p>
                  <p className="text-xs text-muted-foreground">Mostrar apenas produtos disponíveis hoje</p>
                </div>
                <Switch checked={showcaseMode} onCheckedChange={setShowcaseMode} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveSettings} className="w-full rounded-xl h-12 btn-3d font-bold text-base">
            Salvar Configurações
          </Button>
        </div>
      )}

      {/* TAB: Categories */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <Card className="card-elevated">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">📂 Categorias</CardTitle>
                <Button size="sm" className="rounded-xl gap-1 btn-3d" onClick={openNewCat}>
                  <Plus className="w-4 h-4" /> Nova
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma categoria criada. Crie categorias como Bolos, Doces, Cupcakes...</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="flex items-center gap-2 bg-secondary/50 px-4 py-3 rounded-xl">
                      <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                      <span className="flex-1 font-bold text-sm text-foreground">{cat.name}</span>
                      <Badge variant="secondary" className="text-xs">{products.filter(p => p.category_id === cat.id).length} produtos</Badge>
                      <button onClick={() => openEditCat(cat)} className="text-primary hover:text-primary/80"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteCat(cat.id)} className="text-destructive/60 hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editCatId ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
              <Input placeholder="Ex: Bolos decorados" value={catName} onChange={e => setCatName(e.target.value)} className="h-12 rounded-xl" />
              <Button onClick={saveCat} className="w-full rounded-xl h-12 btn-3d font-bold">
                {editCatId ? "Salvar" : "Adicionar"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* TAB: Products */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">🍰 Produtos</h2>
            <Button size="sm" className="rounded-xl gap-1 btn-3d" onClick={openNewProd}>
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>

          {products.length === 0 ? (
            <Card className="card-elevated">
              <CardContent className="py-8">
                <EmptyState icon={ShoppingBag} title="Nenhum produto no cardápio" description="Adicione seus produtos para montar o cardápio." />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {products.map(p => {
                const st = statusLabel(p.status);
                const catName = categories.find(c => c.id === p.category_id)?.name;
                return (
                  <Card key={p.id} className="card-elevated overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                            <Camera className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="font-bold text-foreground truncate">{p.name}</p>
                              {catName && <p className="text-xs text-muted-foreground">{catName}</p>}
                            </div>
                            <p className="text-sm font-extrabold text-primary whitespace-nowrap">R$ {Number(p.price).toFixed(2)}</p>
                          </div>
                          {p.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{p.description}</p>}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
                            {p.featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Destaque</span>}
                            {p.available_today && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">📅 Hoje</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 flex-1" onClick={() => toggleFeatured(p)}>
                          <Star className={`w-3.5 h-3.5 ${p.featured ? "fill-amber-500 text-amber-500" : ""}`} /> {p.featured ? "Remover destaque" : "Destacar"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 flex-1" onClick={() => toggleAvailableToday(p)}>
                          <Sparkles className={`w-3.5 h-3.5 ${p.available_today ? "text-blue-500" : ""}`} /> {p.available_today ? "Remover hoje" : "Disp. hoje"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEditProd(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => duplicateProd(p)}><Copy className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => deleteProd(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Product Dialog */}
          <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editProdId ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                {/* Photo */}
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Foto do produto</Label>
                  {prodPhotoUrl && <img src={prodPhotoUrl} alt="Produto" className="w-full h-32 object-cover rounded-xl" />}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1" asChild>
                      <span><Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Enviar foto"}</span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return;
                      const url = await uploadImage(f, "product");
                      if (url) setProdPhotoUrl(url);
                    }} />
                  </label>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Nome *</Label>
                  <Input value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Ex: Bolo de chocolate" className="h-11 rounded-xl" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Descrição</Label>
                  <Textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Descrição curta..." className="rounded-xl" rows={2} />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Preço (R$)</Label>
                  <Input type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="0.00" className="h-11 rounded-xl" step="0.01" />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Categoria</Label>
                  <Select value={prodCatId} onValueChange={setProdCatId}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Status</Label>
                  <Select value={prodStatus} onValueChange={setProdStatus}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">✅ Disponível</SelectItem>
                      <SelectItem value="sob_encomenda">📋 Sob encomenda</SelectItem>
                      <SelectItem value="esgotado">❌ Esgotado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold">⭐ Produto em destaque</Label>
                  <Switch checked={prodFeatured} onCheckedChange={setProdFeatured} />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold">📅 Disponível hoje</Label>
                  <Switch checked={prodAvailableToday} onCheckedChange={setProdAvailableToday} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={saveProd} className="w-full rounded-xl h-12 btn-3d font-bold">
                  {editProdId ? "Salvar Produto" : "Adicionar Produto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* TAB: Preview */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <Card className="card-elevated overflow-hidden">
            <div className="relative">
              {coverPhotoUrl ? (
                <img src={coverPhotoUrl} alt="Capa" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor})` }}>
                  <Camera className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl border-4 border-white bg-secondary shadow-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            <CardContent className="pt-12 pb-4 text-center space-y-1">
              <h2 className="text-xl font-extrabold" style={{ color: primaryColor }}>{storeName || "Sua Confeitaria"}</h2>
              {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
              <div className="flex gap-2 justify-center pt-2">
                <Button size="sm" className="rounded-xl font-bold" style={{ backgroundColor: buttonColor, color: "#fff" }}>
                  Ver Cardápio
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl font-bold" style={{ borderColor: buttonColor, color: buttonColor }}>
                  <MessageCircle className="w-4 h-4 mr-1" /> Pedir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Featured preview */}
          {products.filter(p => p.featured).length > 0 && (
            <div>
              <h3 className="text-base font-bold mb-2" style={{ color: primaryColor }}>⭐ Destaques</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {products.filter(p => p.featured).map(p => (
                  <div key={p.id} className="min-w-[160px] rounded-xl overflow-hidden bg-card shadow-md">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="w-full h-24 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-secondary flex items-center justify-center"><Camera className="w-6 h-6 text-muted-foreground/30" /></div>
                    )}
                    <div className="p-2">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      <p className="text-sm font-extrabold" style={{ color: primaryColor }}>R$ {Number(p.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories + products preview */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(c => (
                <button key={c.id} className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap" style={{ backgroundColor: secondaryColor, color: primaryColor }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {products.length > 0 ? (
            <div className="space-y-3">
              {products.map(p => {
                if (showcaseMode && !p.available_today) return null;
                const st = statusLabel(p.status);
                return (
                  <div key={p.id} className="flex gap-3 p-3 bg-card rounded-xl shadow-sm border border-border">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                        <Camera className="w-5 h-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                      <p className="text-sm font-extrabold mt-0.5" style={{ color: primaryColor }}>R$ {Number(p.price).toFixed(2)}</p>
                      {p.status === "esgotado" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 mt-1 inline-block">ESGOTADO</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum produto adicionado ainda.</p>
          )}

          {/* Footer info */}
          <Card className="card-elevated">
            <CardContent className="py-4 text-center space-y-1">
              {profile?.address && <p className="text-xs text-muted-foreground">📍 {profile.address}</p>}
              {businessHours && <p className="text-xs text-muted-foreground">⏰ {businessHours}</p>}
              {profile?.whatsapp && <p className="text-xs text-muted-foreground">📱 {profile.whatsapp}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DigitalMenu;
