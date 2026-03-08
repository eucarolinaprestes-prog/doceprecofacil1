import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, CreditCard } from "lucide-react";

const incomeCategories = ["Bolos", "Encomendas", "Fatias", "Doces", "Salgados", "Cupcakes", "Outros"];
const expenseCategories = ["Ingredientes", "Embalagens", "Luz", "Gás", "Uber/99", "Aplicativos", "Entregador", "Compras", "Outros"];

const paymentMethods = [
  { value: "pix", label: "Pix", icon: Smartphone },
  { value: "debito", label: "Débito", icon: CreditCard },
  { value: "credito", label: "Crédito", icon: CreditCard },
];

interface FinanceDialogProps {
  type: "income" | "expense" | null;
  onClose: () => void;
  onSaved: () => void;
}

const FinanceDialog = ({ type, onClose, onSaved }: FinanceDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [supplier, setSupplier] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const finalCategory = category === "Outros" && customCategory.trim() ? customCategory.trim() : category;

  const handleSave = async () => {
    if (!user || !amount || !category) return;
    setSaving(true);
    try {
      if (type === "income") {
        await supabase.from("financial_income").insert({
          user_id: user.id, amount: Number(amount), category: finalCategory, date, payment_method: paymentMethod, client_name: clientName, notes,
        });
      } else {
        await supabase.from("financial_expense").insert({
          user_id: user.id, amount: Number(amount), category: finalCategory, date, supplier, description,
        });
      }
      toast({ title: type === "income" ? "Entrada registrada! 💚" : "Saída registrada! 📝" });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const categories = type === "income" ? incomeCategories : expenseCategories;

  return (
    <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">
            {type === "income" ? "Adicionar Entrada 💚" : "Adicionar Saída 📝"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Valor (R$)</label>
            <CurrencyInput
              placeholder="0,00"
              value={amount}
              onValueChange={setAmount}
              className="text-lg font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {category === "Outros" && (
              <Input
                placeholder="Especifique a categoria..."
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Data</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {type === "income" && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Forma de pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold transition-all ${
                        paymentMethod === pm.value
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <pm.icon className="w-4 h-4" />
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Cliente (opcional)</label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observações (opcional)</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" />
              </div>
            </>
          )}

          {type === "expense" && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Fornecedor (opcional)</label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nome do fornecedor" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição (opcional)</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
              </div>
            </>
          )}

          <Button
            onClick={handleSave}
            disabled={!amount || !category || saving}
            className="w-full h-12 text-base font-bold rounded-xl"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceDialog;
