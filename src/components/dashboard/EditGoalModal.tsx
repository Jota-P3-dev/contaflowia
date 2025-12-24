import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Plane, Car, Home, GraduationCap, Heart, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string | null;
  color: string | null;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal | null;
  onSave: () => void;
  onNotifyAI: (action: "create" | "update" | "delete", goalName: string, oldValue?: number, newValue?: number) => void;
}

const iconOptions = [
  { name: "Target", icon: Target },
  { name: "Plane", icon: Plane },
  { name: "Car", icon: Car },
  { name: "Home", icon: Home },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Heart", icon: Heart },
  { name: "Briefcase", icon: Briefcase },
];

const colorOptions = ["cyan", "magenta", "purple", "success"];

export function EditGoalModal({ isOpen, onClose, goal, onSave, onNotifyAI }: EditGoalModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Target");
  const [selectedColor, setSelectedColor] = useState("cyan");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
      setCurrentAmount((goal.current_amount || 0).toString());
      setSelectedIcon(goal.icon || "Target");
      setSelectedColor(goal.color || "cyan");
    } else {
      setName("");
      setTargetAmount("");
      setCurrentAmount("0");
      setSelectedIcon("Target");
      setSelectedColor("cyan");
    }
  }, [goal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const goalData = {
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        icon: selectedIcon,
        color: selectedColor,
        user_id: user.id,
      };

      if (goal) {
        const { error } = await supabase
          .from("goals")
          .update(goalData)
          .eq("id", goal.id);

        if (error) throw error;
        toast.success("Objetivo atualizado!");
        onNotifyAI("update", name, goal.target_amount, parseFloat(targetAmount));
      } else {
        const { error } = await supabase.from("goals").insert(goalData);

        if (error) throw error;
        toast.success("Objetivo criado!");
        onNotifyAI("create", name);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Erro ao salvar objetivo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
      toast.success("Objetivo removido!");
      onNotifyAI("delete", goal.name);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Erro ao remover objetivo");
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
                {goal ? "Editar Objetivo" : "Novo Objetivo"}
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
                  Nome do objetivo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Viagem Europa"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Meta (R$)
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="15000"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Acumulado (R$)
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="5000"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ícone
                </label>
                <div className="flex gap-2 flex-wrap">
                  {iconOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setSelectedIcon(option.name)}
                        className={`p-3 rounded-xl border transition-all ${
                          selectedIcon === option.name
                            ? "border-primary bg-primary/20"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-foreground" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cor
                </label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        selectedColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      } ${
                        color === "cyan" ? "bg-cyan" :
                        color === "magenta" ? "bg-magenta" :
                        color === "purple" ? "bg-purple" :
                        "bg-success"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {goal && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-3 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Salvando..." : goal ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
