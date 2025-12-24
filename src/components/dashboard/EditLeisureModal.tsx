import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LeisureBudget {
  id: string;
  monthly_amount: number;
  spent_this_month: number | null;
}

interface EditLeisureModalProps {
  isOpen: boolean;
  onClose: () => void;
  leisure?: LeisureBudget | null;
  onSave: () => void;
  onNotifyAI: (action: "create" | "update" | "delete", itemName: string, oldValue?: number, newValue?: number) => void;
}

export function EditLeisureModal({ isOpen, onClose, leisure, onSave, onNotifyAI }: EditLeisureModalProps) {
  const { user } = useAuth();
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [spentThisMonth, setSpentThisMonth] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leisure) {
      setMonthlyAmount(leisure.monthly_amount.toString());
      setSpentThisMonth((leisure.spent_this_month || 0).toString());
    } else {
      setMonthlyAmount("");
      setSpentThisMonth("0");
    }
  }, [leisure, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const leisureData = {
        monthly_amount: parseFloat(monthlyAmount),
        spent_this_month: parseFloat(spentThisMonth) || 0,
        user_id: user.id,
      };

      if (leisure) {
        const { error } = await supabase
          .from("leisure_budget")
          .update(leisureData)
          .eq("id", leisure.id);

        if (error) throw error;
        toast.success("Orçamento de lazer atualizado!");
        onNotifyAI("update", "Orçamento de lazer", leisure.monthly_amount, parseFloat(monthlyAmount));
      } else {
        const { error } = await supabase.from("leisure_budget").insert(leisureData);

        if (error) throw error;
        toast.success("Orçamento de lazer configurado!");
        onNotifyAI("create", "Orçamento de lazer");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving leisure:", error);
      toast.error("Erro ao salvar orçamento de lazer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-strong rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {leisure ? "Editar Orçamento de Lazer" : "Configurar Orçamento de Lazer"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Orçamento mensal (R$)
                </label>
                <input
                  type="number"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                  placeholder="500.00"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto você quer reservar para lazer todo mês
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Gasto este mês (R$)
                </label>
                <input
                  type="number"
                  value={spentThisMonth}
                  onChange={(e) => setSpentThisMonth(e.target.value)}
                  placeholder="150.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto você já gastou com lazer este mês
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
