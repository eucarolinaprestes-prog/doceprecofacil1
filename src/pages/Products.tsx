import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Trash2, Copy, Edit } from "lucide-react";
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
    toast({ title: "Produto duplicado" });
    fetchProducts();
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
        <Button onClick={() => navigate("/pricing")} className="rounded-xl">+ Novo produto</Button>
      </div>

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
          {products.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{p.name}</p>
                  <div className="flex gap-4 text-sm mt-1">
                    <span className="text-muted-foreground">Custo: <strong>R$ {Number(p.total_cost || 0).toFixed(2)}</strong></span>
                    <span className="text-success">Preço: <strong>R$ {Number(p.suggested_price || 0).toFixed(2)}</strong></span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(p)}><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
