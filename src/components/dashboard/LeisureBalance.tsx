import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, PiggyBank, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "./EmptyState";
import { EditLeisureModal } from "./EditLeisureModal";
import { useEditNotification } from "@/contexts/EditNotificationContext";

interface LeisureBudget {
  id: string;
  monthly_amount: number;
  spent_this_month: number | null;
}

export function LeisureBalance() {
  const { user } = useAuth();
  const { notifyEdit } = useEditNotification();
  const [leisure, setLeisure] = useState<LeisureBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLeisure = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("leisure_budget")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setLeisure(data);
    } catch (error) {
      console.error("Error fetching leisure:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeisure();
  }, [user]);

  const handleNotifyAI = (action: "create" | "update" | "delete", itemName: string, oldValue?: number, newValue?: number) => {
    notifyEdit({
      type: "leisure",
      action,
      itemName,
      oldValue,
      newValue,
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-xl w-1/2" />
          <div className="h-24 bg-muted rounded-xl" />
        </div>
      </motion.div>
    );
  }

  const totalBudget = leisure?.monthly_amount || 0;
  const spent = leisure?.spent_this_month || 0;
  const remaining = Math.max(0, totalBudget - spent);
  const spentPercentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const remainingPercentage = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-magenta/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Lazer Protegido
              </h3>
              <p className="text-sm text-muted-foreground">
                Aproveite sem culpa
              </p>
            </div>
          </div>
          {leisure && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {!leisure || totalBudget === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Lazer não configurado"
            description="Defina um orçamento mensal para seu lazer e aproveite sem culpa!"
            actionLabel="Configurar lazer"
            onAction={() => setIsModalOpen(true)}
            variant="magenta"
          />
        ) : (
          <>
            {/* Balance Meter */}
            <div className="mb-6 p-4 rounded-xl bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-magenta" />
                  <span className="text-sm font-medium">Gasto</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Disponível</span>
                  <PiggyBank className="w-4 h-4 text-success" />
                </div>
              </div>
              
              <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-magenta to-purple rounded-l-full"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${remainingPercentage}%` }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="absolute right-0 top-0 h-full bg-gradient-to-l from-success to-cyan rounded-r-full"
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  R$ {spent.toLocaleString("pt-BR")} usado
                </span>
                <span className="text-xs text-success font-medium">
                  R$ {remaining.toLocaleString("pt-BR")} disponível
                </span>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-magenta/10 border border-magenta/20">
                <p className="text-xs text-muted-foreground mb-1">Gasto este mês</p>
                <p className="text-xl font-bold text-magenta">
                  R$ {spent.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-xs text-muted-foreground mb-1">Orçamento total</p>
                <p className="text-xl font-bold text-success">
                  R$ {totalBudget.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <EditLeisureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leisure={leisure}
        onSave={fetchLeisure}
        onNotifyAI={handleNotifyAI}
      />
    </>
  );
}
