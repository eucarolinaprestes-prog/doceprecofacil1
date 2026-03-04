import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ShoppingBag, Target, AlertTriangle } from "lucide-react";
import { mockDashboard } from "@/services/mockData";

const Dashboard = () => {
  const data = mockDashboard;

  const stats = [
    { label: "Faturamento", value: `R$ ${data.monthly_revenue.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "Lucro", value: `R$ ${data.monthly_profit.toFixed(2)}`, icon: TrendingUp, color: "text-primary" },
    { label: "Encomendas", value: data.weekly_orders.toString(), icon: ShoppingBag, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goal progress */}
      <Card className="border-border/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <span className="font-semibold">Meta Mensal</span>
            </div>
            <span className="text-sm font-bold text-primary">{data.goal_progress.toFixed(1)}%</span>
          </div>
          <Progress value={data.goal_progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            R$ {data.monthly_revenue.toFixed(2)} de R$ {data.goal_target.toFixed(2)}
          </p>
        </CardContent>
      </Card>

      {/* Low stock alerts */}
      {data.low_stock_alerts.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="font-semibold">Estoque Baixo</span>
            </div>
            <div className="space-y-2">
              {data.low_stock_alerts.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.name}</span>
                  <Badge variant="outline" className="text-warning border-warning/40">
                    {a.quantity} {a.unit} (mín: {a.minimum})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
