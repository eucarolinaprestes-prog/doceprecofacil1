import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { mockGoal } from "@/services/mockData";
import type { Goal } from "@/types";
import { useToast } from "@/hooks/use-toast";

const MONTHS = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const Goals = () => {
  const [goal, setGoal] = useState<Goal>(mockGoal);
  const [editTarget, setEditTarget] = useState(goal.target_revenue);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const progress = goal.target_revenue > 0 ? (goal.current_revenue / goal.target_revenue) * 100 : 0;

  const saveGoal = () => {
    setGoal({ ...goal, target_revenue: editTarget });
    setIsEditing(false);
    toast({ title: "Meta atualizada!" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Metas</h1>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Meta de {MONTHS[goal.month]} {goal.year}</h2>
              <p className="text-sm text-muted-foreground">Faturamento mensal</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-bold text-primary">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-4" />
            <div className="flex justify-between text-sm">
              <span>R$ {goal.current_revenue.toFixed(2)}</span>
              <span className="font-semibold">R$ {goal.target_revenue.toFixed(2)}</span>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <Input type="number" value={editTarget} onChange={(e) => setEditTarget(+e.target.value)} className="h-11 rounded-xl" step="100" />
              <Button onClick={saveGoal} className="rounded-xl">Salvar</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">Cancelar</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => { setEditTarget(goal.target_revenue); setIsEditing(true); }} className="rounded-xl w-full">
              Alterar Meta
            </Button>
          )}

          {progress >= 100 && (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
              <p className="text-success font-bold">🎉 Parabéns! Meta atingida!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Goals;
