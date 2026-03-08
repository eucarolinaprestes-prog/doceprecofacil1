import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Star, Award, Gem, Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Prata",
    price: "R$ 9,90",
    period: "semanal",
    icon: Award,
    gradient: "from-slate-400 via-slate-300 to-slate-200",
    borderColor: "border-slate-300",
    btnClass: "bg-slate-500 hover:bg-slate-600 text-white",
    features: ["Precificação ilimitada", "Até 20 produtos", "Suporte individual"],
  },
  {
    name: "Ouro",
    price: "R$ 27",
    period: "mensal",
    icon: Award,
    gradient: "from-amber-400 via-yellow-300 to-amber-200",
    borderColor: "border-amber-300",
    btnClass: "bg-amber-500 hover:bg-amber-600 text-white",
    popular: true,
    features: ["Tudo do Prata", "Cardápio digital", "Encomendas ilimitadas", "Suporte individual VIP"],
  },
  {
    name: "Diamante",
    price: "R$ 97",
    period: "anual",
    icon: Gem,
    gradient: "from-rose-400 via-pink-300 to-rose-200",
    borderColor: "border-primary/40",
    btnClass: "bg-primary hover:bg-primary/90 text-primary-foreground btn-3d",
    features: ["Tudo do Ouro", "Relatórios avançados", "WhatsApp automático", "Suporte individual premium"],
  },
];

const Plans = () => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto shadow-lg">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Escolha seu plano</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Invista no seu negócio e tenha acesso a todas as ferramentas 💎</p>
      </div>

      <div className="grid gap-5">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card key={plan.name} className={`relative overflow-hidden card-elevated border-2 ${plan.borderColor} ${plan.popular ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}>
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${plan.gradient}`} />
              {plan.popular && (
                <div className="absolute -top-0 right-4 bg-amber-400 text-amber-900 px-3 py-1 rounded-b-lg text-xs font-bold flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" /> Mais popular
                </div>
              )}
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-extrabold">{plan.name}</CardTitle>
                    <div>
                      <span className="text-2xl font-extrabold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground font-medium">/{plan.period}</span>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success" strokeWidth={3} />
                    </div>
                    <span className="font-medium">{f}</span>
                  </div>
                ))}
                {plan.current ? (
                  <Button disabled className="w-full rounded-xl mt-3 h-12 text-base font-bold bg-success/20 text-success cursor-not-allowed border border-success/30">
                    ✅ PLANO ATUAL
                  </Button>
                ) : (
                  <Button className={`w-full rounded-xl mt-3 h-12 text-base font-bold ${plan.btnClass} animate-pulse`}>
                    ASSINAR AGORA
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Plans;