import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const DigitalMenu = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Cardápio Digital</h1>
      <EmptyState
        icon={BookOpen}
        title="Cardápio em construção"
        description="Em breve você poderá criar seu cardápio digital e compartilhar com clientes pelo WhatsApp."
      />
    </div>
  );
};

export default DigitalMenu;
