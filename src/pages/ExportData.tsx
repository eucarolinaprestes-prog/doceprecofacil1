import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Package, BookOpen, ShoppingCart, Users, ShoppingBag, Wallet, DollarSign, Cake, UtensilsCrossed, List, Crown, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ExportItem {
  label: string;
  table: string;
  icon: React.ElementType;
  columns?: string;
}

const exportItems: ExportItem[] = [
  { label: "Produtos", table: "products", icon: Cake },
  { label: "Receitas", table: "recipes", icon: BookOpen },
  { label: "Insumos", table: "ingredients", icon: Package },
  { label: "Embalagens", table: "packaging", icon: Package },
  { label: "Clientes", table: "clients", icon: Users },
  { label: "Encomendas", table: "orders", icon: ShoppingBag },
  { label: "Receitas Financeiras", table: "financial_income", icon: Wallet },
  { label: "Despesas", table: "financial_expense", icon: DollarSign },
  { label: "Custos Fixos", table: "fixed_costs", icon: List },
  { label: "Custos Variáveis", table: "variable_costs", icon: List },
  { label: "Lista de Compras", table: "shopping_list", icon: ShoppingCart },
  { label: "Assinaturas", table: "assinaturas", icon: Crown },
  { label: "Cardápio - Produtos", table: "menu_products", icon: UtensilsCrossed },
  { label: "Cardápio - Categorias", table: "menu_categories", icon: UtensilsCrossed },
  { label: "Logs de Auditoria", table: "audit_logs", icon: FileText },
];

function toCsv(data: Record<string, any>[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ExportData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const exportTable = async (table: string, label: string) => {
    if (!user) return;
    setLoading(table);
    try {
      const { data, error } = await (supabase.from(table as any) as any).select("*");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info(`${label}: nenhum dado encontrado.`);
        setLoading(null);
        return;
      }
      const csv = toCsv(data);
      downloadFile(csv, `${table}_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`${label} exportado com sucesso!`);
    } catch (e: any) {
      toast.error(`Erro ao exportar ${label}: ${e.message}`);
    }
    setLoading(null);
  };

  const exportAll = async () => {
    if (!user) return;
    setLoadingAll(true);
    for (const item of exportItems) {
      try {
        const { data, error } = await (supabase.from(item.table as any) as any).select("*");
        if (error) throw error;
        if (data && data.length > 0) {
          const csv = toCsv(data);
          downloadFile(csv, `${item.table}_${new Date().toISOString().slice(0, 10)}.csv`);
        }
      } catch {}
      // small delay between downloads
      await new Promise((r) => setTimeout(r, 300));
    }
    toast.success("Exportação completa!");
    setLoadingAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
          <p className="text-sm text-muted-foreground">Exporte seus dados em formato CSV</p>
        </div>
        <Button onClick={exportAll} disabled={loadingAll} className="gap-2">
          {loadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar Tudo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportItems.map((item) => (
          <Card key={item.table} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <item.icon className="w-4 h-4 text-primary" />
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                disabled={loading === item.table || loadingAll}
                onClick={() => exportTable(item.table, item.label)}
              >
                {loading === item.table ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Exportar CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExportData;
