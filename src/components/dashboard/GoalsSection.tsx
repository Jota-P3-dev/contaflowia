import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Plane, Car, Home, GraduationCap, Heart, Briefcase, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "./EmptyState";
import { EditGoalModal } from "./EditGoalModal";
import { useEditNotification } from "@/contexts/EditNotificationContext";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number | null;
  icon: string | null;
  color: string | null;
}

const iconMap: Record<string, typeof Target> = {
  Target,
  Plane,
  Car,
  Home,
  GraduationCap,
  Heart,
  Briefcase,
};

const variantStyles: Record<string, { bg: string; progress: string; icon: string }> = {
  cyan: {
    bg: "bg-cyan/20",
    progress: "bg-gradient-to-r from-cyan to-cyan-glow",
    icon: "text-cyan",
  },
  magenta: {
    bg: "bg-magenta/20",
    progress: "bg-gradient-to-r from-magenta to-magenta-glow",
    icon: "text-magenta",
  },
  purple: {
    bg: "bg-purple/20",
    progress: "bg-gradient-to-r from-purple to-purple-glow",
    icon: "text-purple",
  },
  success: {
    bg: "bg-success/20",
    progress: "bg-gradient-to-r from-success to-cyan",
    icon: "text-success",
  },
};

export function GoalsSection() {
  const { user } = useAuth();
  const { notifyEdit } = useEditNotification();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_achieved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleNotifyAI = (action: "create" | "update" | "delete", goalName: string, oldValue?: number, newValue?: number) => {
    notifyEdit({
      type: "goal",
      action,
      itemName: goalName,
      oldValue,
      newValue,
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-xl w-1/2" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Seus Objetivos</h3>
            <p className="text-sm text-muted-foreground">
              Acompanhe seu progresso
            </p>
          </div>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhum objetivo ainda"
            description="Defina metas financeiras para alcançar seus sonhos!"
            actionLabel="Criar objetivo"
            onAction={handleAddNew}
            variant="success"
          />
        ) : (
          <div className="space-y-5">
            {goals.map((goal, index) => {
              const current = goal.current_amount || 0;
              const percentage = Math.round((current / goal.target_amount) * 100);
              const colorKey = goal.color || "cyan";
              const styles = variantStyles[colorKey] || variantStyles.cyan;
              const iconName = goal.icon || "Target";
              const Icon = iconMap[iconName] || Target;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className="group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                        styles.bg
                      )}
                    >
                      <Icon className={cn("w-4 h-4", styles.icon)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {goal.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {percentage}%
                          </span>
                          <button
                            onClick={() => handleEdit(goal)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md transition-all"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-11">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                        className={cn("h-full rounded-full", styles.progress)}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        R$ {current.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        R$ {goal.target_amount.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddNew}
          className="w-full mt-6 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center justify-center gap-2 text-sm"
        >
          <TrendingUp className="w-4 h-4" />
          Adicionar novo objetivo
        </motion.button>
      </motion.div>

      <EditGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goal={editingGoal}
        onSave={fetchGoals}
        onNotifyAI={handleNotifyAI}
      />
    </>
  );
}
