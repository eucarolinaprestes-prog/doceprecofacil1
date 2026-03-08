import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Camera, MessageCircle, Clock, MapPin, Phone } from "lucide-react";

interface MenuProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  status: string;
  featured: boolean;
  available_today: boolean;
  category_id: string | null;
  sort_order: number;
}

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number | null;
}

const PublicMenu = () => {
  const { userId } = useParams<{ userId: string }>();
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showOnlyToday, setShowOnlyToday] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [{ data: prods }, { data: cats }, { data: ms }, { data: prof }] = await Promise.all([
        (supabase.from("menu_products") as any).select("*").eq("user_id", userId).order("sort_order"),
        supabase.from("menu_categories").select("*").eq("user_id", userId).order("sort_order"),
        (supabase.from("menu_settings") as any).select("*").eq("user_id", userId).single(),
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setSettings(ms);
      setProfile(prof);
      if (ms?.showcase_mode) setShowOnlyToday(true);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 text-sm">Carregando cardápio...</div>
      </div>
    );
  }

  if (!settings && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cardápio não encontrado.</p>
      </div>
    );
  }

  const pc = settings?.primary_color || "#e91e7b";
  const sc = settings?.secondary_color || "#f8bbd0";
  const bc = settings?.button_color || "#e91e7b";
  const storeName = settings?.store_name || profile?.store_name || "Confeitaria";
  const tagline = settings?.tagline || "";
  const coverPhoto = settings?.cover_photo_url || "";
  const logoPhoto = settings?.logo_url || profile?.logo_url || "";
  const whatsapp = profile?.whatsapp || "";
  const address = profile?.address || "";
  const businessHours = settings?.business_hours || "";

  const featuredProducts = products.filter(p => p.featured && p.status !== "esgotado");
  const todayProducts = products.filter(p => p.available_today);

  let displayProducts = showOnlyToday ? todayProducts : products;
  if (activeCategory) {
    displayProducts = displayProducts.filter(p => p.category_id === activeCategory);
  }

  const openWhatsApp = (productName?: string) => {
    if (!whatsapp) return;
    const num = whatsapp.replace(/\D/g, "");
    const msg = productName
      ? encodeURIComponent(`Olá! Gostaria de pedir:\n\nProduto: ${productName}`)
      : encodeURIComponent(`Olá! Gostaria de fazer um pedido.`);
    window.open(`https://wa.me/55${num}?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Cover */}
      <div className="relative">
        {coverPhoto ? (
          <img src={coverPhoto} alt="Capa" className="w-full h-48 sm:h-56 object-cover" />
        ) : (
          <div className="w-full h-48 sm:h-56" style={{ background: `linear-gradient(135deg, ${pc}, ${sc})` }} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          {logoPhoto ? (
            <img src={logoPhoto} alt="Logo" className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-xl flex items-center justify-center">
              <span className="text-2xl">🍰</span>
            </div>
          )}
        </div>
      </div>

      {/* Store Info */}
      <div className="text-center pt-14 pb-4 px-4">
        <h1 className="text-2xl font-extrabold" style={{ color: pc }}>{storeName}</h1>
        {tagline && <p className="text-sm text-gray-500 mt-1">{tagline}</p>}
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-3 px-4 pb-4 max-w-md mx-auto">
        <button
          onClick={() => document.getElementById("cardapio-section")?.scrollIntoView({ behavior: "smooth" })}
          className="flex-1 py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-transform active:scale-95"
          style={{ backgroundColor: bc }}
        >
          Ver Cardápio
        </button>
        {whatsapp && (
          <button
            onClick={() => openWhatsApp()}
            className="flex-1 py-3 rounded-xl font-bold text-sm shadow-lg border-2 transition-transform active:scale-95 flex items-center justify-center gap-2"
            style={{ borderColor: bc, color: bc }}
          >
            <MessageCircle className="w-4 h-4" /> Pedir
          </button>
        )}
      </div>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-base font-extrabold mb-3" style={{ color: pc }}>⭐ Destaques</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {featuredProducts.map(p => (
              <div key={p.id} className="min-w-[170px] max-w-[170px] rounded-2xl overflow-hidden bg-white shadow-md snap-start">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl">🍰</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-bold truncate text-gray-800">{p.name}</p>
                  <p className="text-sm font-extrabold mt-1" style={{ color: pc }}>R$ {Number(p.price).toFixed(2)}</p>
                  {whatsapp && (
                    <button
                      onClick={() => openWhatsApp(p.name)}
                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold text-white transition-transform active:scale-95"
                      style={{ backgroundColor: bc }}
                    >
                      Pedir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available today */}
      {todayProducts.length > 0 && !showOnlyToday && (
        <div className="px-4 pb-4">
          <h2 className="text-base font-extrabold mb-3" style={{ color: pc }}>📅 Disponível Hoje</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {todayProducts.map(p => (
              <div key={p.id} className="min-w-[170px] max-w-[170px] rounded-2xl overflow-hidden bg-white shadow-md snap-start">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl">🧁</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-bold truncate text-gray-800">{p.name}</p>
                  <p className="text-sm font-extrabold mt-1" style={{ color: pc }}>R$ {Number(p.price).toFixed(2)}</p>
                  {whatsapp && (
                    <button
                      onClick={() => openWhatsApp(p.name)}
                      className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold text-white transition-transform active:scale-95"
                      style={{ backgroundColor: bc }}
                    >
                      Pedir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div id="cardapio-section" className="px-4 pb-3">
        {showOnlyToday && (
          <div className="text-center mb-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: pc }}>
              📅 Cardápio do Dia
            </span>
          </div>
        )}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          <button
            onClick={() => { setActiveCategory(null); setShowOnlyToday(false); }}
            className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors snap-start"
            style={{
              backgroundColor: !activeCategory && !showOnlyToday ? pc : sc,
              color: !activeCategory && !showOnlyToday ? "#fff" : pc,
            }}
          >
            Todos
          </button>
          <button
            onClick={() => { setActiveCategory(null); setShowOnlyToday(true); }}
            className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors snap-start"
            style={{
              backgroundColor: showOnlyToday && !activeCategory ? pc : sc,
              color: showOnlyToday && !activeCategory ? "#fff" : pc,
            }}
          >
            📅 Hoje
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveCategory(c.id); setShowOnlyToday(false); }}
              className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors snap-start"
              style={{
                backgroundColor: activeCategory === c.id ? pc : sc,
                color: activeCategory === c.id ? "#fff" : pc,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products list */}
      <div className="px-4 pb-6 space-y-3">
        {displayProducts.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Nenhum produto disponível nesta categoria.
          </div>
        ) : (
          displayProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.name} className="w-28 h-28 object-cover shrink-0" />
              ) : (
                <div className="w-28 h-28 bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-3xl">🍰</span>
                </div>
              )}
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <p className="font-bold text-gray-800 truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{p.description}</p>}
                </div>
                <div className="flex items-end justify-between mt-1">
                  <div>
                    <p className="text-base font-extrabold" style={{ color: pc }}>R$ {Number(p.price).toFixed(2)}</p>
                    {p.status === "esgotado" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">ESGOTADO</span>
                    )}
                    {p.status === "sob_encomenda" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">SOB ENCOMENDA</span>
                    )}
                  </div>
                  {whatsapp && p.status !== "esgotado" && (
                    <button
                      onClick={() => openWhatsApp(p.name)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-transform active:scale-95"
                      style={{ backgroundColor: bc }}
                    >
                      Pedir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5 text-center space-y-2">
          <h3 className="text-lg font-extrabold" style={{ color: pc }}>{storeName}</h3>
          {address && (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4" /> {address}
            </p>
          )}
          {businessHours && (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" /> {businessHours}
            </p>
          )}
          {whatsapp && (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              <Phone className="w-4 h-4" /> {whatsapp}
            </p>
          )}
          {whatsapp && (
            <button
              onClick={() => openWhatsApp()}
              className="mt-3 w-full py-3 rounded-xl font-bold text-white text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-300 mt-4">Feito com 💖 Doce Preço Fácil</p>
      </div>
    </div>
  );
};

export default PublicMenu;
