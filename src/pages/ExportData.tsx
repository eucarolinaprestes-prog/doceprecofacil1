import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Package, BookOpen, ShoppingCart, Users, ShoppingBag, Wallet, DollarSign, Cake, UtensilsCrossed, List, Crown, FileText, Copy, Code, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExportItem {
  label: string;
  table: string;
  icon: React.ElementType;
  sql: string;
}

const exportItems: ExportItem[] = [
  { label: "Produtos", table: "products", icon: Cake, sql: `CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  photo_url text DEFAULT '',
  ingredients_json jsonb DEFAULT '[]'::jsonb,
  packaging_json jsonb DEFAULT '[]'::jsonb,
  total_cost numeric DEFAULT 0,
  profit_margin numeric DEFAULT 0,
  suggested_price numeric DEFAULT 0,
  preparation_time integer DEFAULT 0,
  yield_quantity numeric NOT NULL DEFAULT 1,
  yield_unit text NOT NULL DEFAULT 'unidade',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Receitas", table: "recipes", icon: BookOpen, sql: `CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  category text DEFAULT '',
  photo_url text DEFAULT '',
  ingredients_json jsonb DEFAULT '[]'::jsonb,
  total_cost numeric DEFAULT 0,
  yield_quantity numeric DEFAULT 1,
  yield_unit text DEFAULT 'kg',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Insumos", table: "ingredients", icon: Package, sql: `CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'g',
  quantity_purchased numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  cost_per_unit numeric,
  category text DEFAULT '',
  supplier text DEFAULT '',
  current_stock numeric DEFAULT 0,
  min_stock numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Embalagens", table: "packaging", icon: Package, sql: `CREATE TABLE public.packaging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  quantity_purchased numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  cost_per_unit numeric,
  category text DEFAULT '',
  supplier text DEFAULT '',
  current_stock numeric DEFAULT 0,
  min_stock numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Clientes", table: "clients", icon: Users, sql: `CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  whatsapp text DEFAULT '',
  address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Encomendas", table: "orders", icon: ShoppingBag, sql: `CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  client_id uuid REFERENCES public.clients(id),
  product_id uuid REFERENCES public.products(id),
  status text NOT NULL DEFAULT 'pending',
  category text DEFAULT '',
  event_date timestamptz,
  dough text DEFAULT '', topping text DEFAULT '', filling text DEFAULT '', size text DEFAULT '',
  observation text DEFAULT '', notes text DEFAULT '',
  delivery_type text DEFAULT 'pickup', delivery_address text DEFAULT '',
  payment_method text DEFAULT 'pix', payment_percent integer DEFAULT 100,
  total_value numeric DEFAULT 0,
  fee_packaging numeric DEFAULT 0, fee_topper numeric DEFAULT 0,
  fee_delivery numeric DEFAULT 0, fee_decoration numeric DEFAULT 0, fee_card_percent numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Receitas Financeiras", table: "financial_income", icon: Wallet, sql: `CREATE TABLE public.financial_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text DEFAULT '',
  payment_method text DEFAULT '',
  client_name text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Despesas", table: "financial_expense", icon: DollarSign, sql: `CREATE TABLE public.financial_expense (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text DEFAULT '',
  description text DEFAULT '',
  supplier text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Custos Fixos", table: "fixed_costs", icon: List, sql: `CREATE TABLE public.fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Custos Variáveis", table: "variable_costs", icon: List, sql: `CREATE TABLE public.variable_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Lista de Compras", table: "shopping_list", icon: ShoppingCart, sql: `CREATE TABLE public.shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  ingredient_name text NOT NULL,
  quantity numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  total numeric,
  store text,
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Assinaturas", table: "assinaturas", icon: Crown, sql: `CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  plano text NOT NULL DEFAULT 'prata',
  status text NOT NULL DEFAULT 'ativo',
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_expiracao timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Cardápio - Produtos", table: "menu_products", icon: UtensilsCrossed, sql: `CREATE TABLE public.menu_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  category_id uuid REFERENCES public.menu_categories(id),
  name text NOT NULL,
  description text DEFAULT '',
  photo_url text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'disponivel',
  featured boolean NOT NULL DEFAULT false,
  available_today boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Cardápio - Categorias", table: "menu_categories", icon: UtensilsCrossed, sql: `CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);` },
  { label: "Logs de Auditoria", table: "audit_logs", icon: FileText, sql: `CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);` },
];

const baseTables = `-- Tabelas base (criar primeiro)
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  name text NOT NULL DEFAULT '',
  store_name text DEFAULT '',
  address text DEFAULT '',
  whatsapp text DEFAULT '',
  logo_url text DEFAULT '',
  desired_salary numeric DEFAULT 0,
  work_days_per_week integer DEFAULT 5,
  work_hours_per_day integer DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id),
  role app_role NOT NULL DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.menu_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid REFERENCES public.businesses(id),
  store_name text DEFAULT '',
  description text DEFAULT '',
  tagline text DEFAULT '',
  logo_url text DEFAULT '',
  cover_photo_url text DEFAULT '',
  primary_color text DEFAULT '#e91e7b',
  secondary_color text DEFAULT '#f8bbd0',
  button_color text DEFAULT '#e91e7b',
  business_hours text DEFAULT '',
  showcase_mode boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);`;

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
  const [expandedSql, setExpandedSql] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`SQL de "${label}" copiado!`);
  };

  const copyAllSql = () => {
    const allSql = baseTables + "\n\n" + exportItems.map((item) => `-- ${item.label}\n${item.sql}`).join("\n\n");
    navigator.clipboard.writeText(allSql);
    toast.success("SQL completo copiado!");
  };

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
      await new Promise((r) => setTimeout(r, 300));
    }
    toast.success("Exportação completa!");
    setLoadingAll(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exportar Dados</h1>
        <p className="text-sm text-muted-foreground">Exporte dados em CSV ou copie o SQL das tabelas para migração</p>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="csv" className="gap-2"><Download className="w-4 h-4" /> Exportar CSV</TabsTrigger>
          <TabsTrigger value="sql" className="gap-2"><Code className="w-4 h-4" /> SQL das Tabelas</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4 mt-4">
          <div className="flex justify-end">
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
                  <Button variant="outline" size="sm" className="w-full gap-2" disabled={loading === item.table || loadingAll} onClick={() => exportTable(item.table, item.label)}>
                    {loading === item.table ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Exportar CSV
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sql" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={copyAllSql} className="gap-2">
              <Copy className="w-4 h-4" /> Copiar Todo SQL
            </Button>
          </div>

          {/* Base tables */}
          <Card>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedSql(expandedSql === "base" ? null : "base")}>
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2"><Code className="w-4 h-4 text-primary" /> Tabelas Base (criar primeiro)</span>
                {expandedSql === "base" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
            {expandedSql === "base" && (
              <CardContent className="space-y-2">
                <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">{baseTables}</pre>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => copyToClipboard(baseTables, "Tabelas Base")}>
                  <Copy className="w-4 h-4" /> Copiar
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Individual tables */}
          {exportItems.map((item) => (
            <Card key={item.table}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedSql(expandedSql === item.table ? null : item.table)}>
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2"><item.icon className="w-4 h-4 text-primary" /> {item.label} ({item.table})</span>
                  {expandedSql === item.table ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
              {expandedSql === item.table && (
                <CardContent className="space-y-2">
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">{item.sql}</pre>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copyToClipboard(item.sql, item.label)}>
                    <Copy className="w-4 h-4" /> Copiar
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExportData;
