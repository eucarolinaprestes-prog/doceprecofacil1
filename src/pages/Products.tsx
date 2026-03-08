import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Pencil, Cake } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!user) return;
    const { data } = await supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Produto excluído" });
    fetchProducts();
  };

  const handleDuplicate = async (product: any) => {
    const { id, created_at, updated_at, ...rest } = product;
    await supabase.from("products").insert({ ...rest, name: `${rest.name} (cópia)` });
    toast({ title: "Produto duplicado! ✅" });
    fetchProducts();
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Cake className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Produtos</h1>
        <p className="text-sm text-muted-foreground">Seus produtos precificados</p>
      </div>

      <Button onClick={() => navigate("/pricing")} className="w-full rounded-xl h-14 btn-3d font-bold text-base gap-2">
        + Precificar Novo Produto
      </Button>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto ainda"
          description="Precifique seu primeiro produto para vê-lo aqui."
          actionLabel="Precificar agora"
          onAction={() => navigate("/pricing")}
        />
      ) : (
        <div className="grid gap-4">
          {products.map((p) => {
            const cost = Number(p.total_cost || 0);
            const price = Number(p.suggested_price || 0);
            const profit = price - cost;
            return (
              <Card key={p.id} className="card-elevated overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Nome no topo */}
                  <div className="flex items-start justify-between">
                    <h3 className="font-extrabold text-foreground text-lg">{p.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => navigate("/pricing")}><Pencil className="w-4 h-4 text-primary" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(p)}><Copy className="w-4 h-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>

                  {/* Foto abaixo do nome */}
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-40 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-full h-28 rounded-xl bg-secondary flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Caixinhas separadas: Custo, Lucro, Preço */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Custo</p>
                      <p className="font-extrabold text-primary text-sm mt-1">R$ {cost.toFixed(2)}</p>
                    </div>
                    <div className="bg-success/10 border border-success/20 p-3 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-success uppercase tracking-wide">Lucro</p>
                      <p className="font-extrabold text-success text-sm mt-1">R$ {profit.toFixed(2)}</p>
                    </div>
                    <div className="gradient-primary p-3 rounded-xl text-center shadow-md">
                      <p className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-wide">Preço</p>
                      <p className="font-extrabold text-primary-foreground text-sm mt-1">R$ {price.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
