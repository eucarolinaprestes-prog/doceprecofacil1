import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";

const plans = [
  { name: "Prata", price: "R$ 9,90", period: "semanal", color: "border-muted-foreground", features: ["Precificação básica", "Até 10 produtos", "Suporte por e-mail"] },
  { name: "Ouro", price: "R$ 27", period: "mensal", color: "border-accent", popular: true, features: ["Precificação ilimitada", "Cardápio digital", "Encomendas ilimitadas", "Suporte prioritário"] },
  { name: "Diamante", price: "R$ 97", period: "anual", color: "border-primary", features: ["Tudo do Ouro", "Relatórios avançados", "WhatsApp automático", "Suporte VIP"] },
];

const Plans = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Crown className="w-10 h-10 text-accent mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Planos</h1>
        <p className="text-sm text-muted-foreground">Escolha o plano ideal para seu negócio</p>
      </div>

      <div className="grid gap-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={`border-2 ${plan.color} ${plan.popular ? "ring-2 ring-accent" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.popular && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full font-medium">Popular</span>}
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
              <Button className="w-full rounded-xl mt-2" variant={plan.popular ? "default" : "outline"}>
                Assinar {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Plans;
