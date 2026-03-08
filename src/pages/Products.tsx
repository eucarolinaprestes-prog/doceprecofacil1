import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, Edit, Package } from "lucide-react";
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
          <Package className="w-7 h-7 text-white" />
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-foreground text-lg">{p.name}</h3>
                      {p.category && <span className="text-xs text-muted-foreground">{p.category}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/60 p-3 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground font-medium">Custo</p>
                      <p className="font-bold text-foreground text-base">R$ {cost.toFixed(2)}</p>
                    </div>
                    <div className="bg-success/10 p-3 rounded-xl text-center">
                      <p className="text-xs text-success font-medium">Lucro</p>
                      <p className="font-bold text-success text-base">R$ {profit.toFixed(2)}</p>
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
                    <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="rounded-xl gap-1 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
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
