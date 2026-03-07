import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Edit } from "lucide-react";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">💰 Preços</h1>
          <p className="text-sm text-muted-foreground">Precifique seus produtos</p>
        </div>
        <Button onClick={() => navigate("/pricing")} className="rounded-xl h-10 btn-3d font-bold gap-1 px-5">
          + PRECIFICAR AGORA
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Edit}
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
                  <div className="flex items-start justify-between">
                    <h3 className="font-extrabold text-foreground text-lg">{p.name}</h3>
                    <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/60 p-3 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground font-medium">Custo</p>
                      <p className="font-bold text-foreground text-base">R$ {cost.toFixed(2)}</p>
                    </div>
                    <div className="bg-pink-light p-3 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground font-medium">Lucro</p>
                      <p className="font-bold text-primary text-base">R$ {profit.toFixed(2)}</p>
                    </div>
                    <div className="gradient-primary p-3 rounded-xl text-center">
                      <p className="text-xs text-primary-foreground/80 font-medium">Preço</p>
                      <p className="font-bold text-primary-foreground text-base">R$ {price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="rounded-xl flex-1 gap-1">
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(p)} className="rounded-xl flex-1 gap-1">
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </Button>
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
