import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const name = (profile?.name || "Confeiteira").toUpperCase();

  return (
    <div className="space-y-6">
      {/* CTA Card - gradient pink like reference */}
      <div className="gradient-primary rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-start gap-2 mb-2">
          <Star className="w-5 h-5 opacity-80" />
        </div>
        <h2 className="text-lg font-extrabold">Olá, {name}! 🎂</h2>
        <p className="text-sm opacity-80 mb-3">Vamos precificar agora?</p>
        <Button
          onClick={() => navigate("/pricing")}
          className="rounded-xl h-10 bg-primary-foreground text-primary font-bold gap-2 hover:bg-primary-foreground/90"
        >
          <Star className="w-4 h-4" /> PRECIFICAR AGORA &gt;
        </Button>
      </div>

      {/* Week calendar */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">📅 Semana atual</p>
          <div className="flex gap-2 justify-between">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex flex-col items-center py-2 px-2 rounded-xl text-xs font-medium flex-1 ${
                  isToday(day)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <span className="capitalize">{format(day, "EEE", { locale: ptBR })}</span>
                <span className="text-lg font-bold">{format(day, "d")}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
