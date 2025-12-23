import { motion } from "framer-motion";
import { Target, TrendingUp, Plane, Car, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  icon: typeof Target;
  target: number;
  current: number;
  variant: "cyan" | "magenta" | "purple";
}

const goals: Goal[] = [
  {
    id: "1",
    name: "Viagem Europa",
    icon: Plane,
    target: 15000,
    current: 8500,
    variant: "cyan",
  },
  {
    id: "2",
    name: "Carro Novo",
    icon: Car,
    target: 60000,
    current: 22000,
    variant: "magenta",
  },
  {
    id: "3",
    name: "Entrada Apartamento",
    icon: Home,
    target: 100000,
    current: 45000,
    variant: "purple",
  },
];

const variantStyles = {
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
};

export function GoalsSection() {
  return (
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

      <div className="space-y-5">
        {goals.map((goal, index) => {
          const percentage = Math.round((goal.current / goal.target) * 100);
          const styles = variantStyles[goal.variant];
          const Icon = goal.icon;

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
                    <span className="text-sm text-muted-foreground">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-11">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                    className={cn("h-full rounded-full", styles.progress)}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    R$ {goal.current.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    R$ {goal.target.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-6 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center justify-center gap-2 text-sm"
      >
        <TrendingUp className="w-4 h-4" />
        Adicionar novo objetivo
      </motion.button>
    </motion.div>
  );
}
