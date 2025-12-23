import { motion } from "framer-motion";
import { Sparkles, PiggyBank, Coffee, Music, Gamepad2, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const leisureCategories = [
  { name: "Alimentação Fora", icon: Utensils, value: 850, budget: 1000, color: "cyan" },
  { name: "Entretenimento", icon: Music, value: 320, budget: 400, color: "magenta" },
  { name: "Games & Hobbies", icon: Gamepad2, value: 180, budget: 300, color: "purple" },
  { name: "Cafés & Lanches", icon: Coffee, value: 220, budget: 250, color: "success" },
];

export function LeisureBalance() {
  const totalLazer = leisureCategories.reduce((acc, cat) => acc + cat.value, 0);
  const totalBudget = leisureCategories.reduce((acc, cat) => acc + cat.budget, 0);
  const savings = 2500;
  const savingsGoal = 3000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-magenta/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-cyan" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Equilíbrio Lazer & Economia
          </h3>
          <p className="text-sm text-muted-foreground">
            Aproveite sem culpa, economize com propósito
          </p>
        </div>
      </div>

      {/* Balance Meter */}
      <div className="mb-6 p-4 rounded-xl bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-magenta" />
            <span className="text-sm font-medium">Lazer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Economia</span>
            <PiggyBank className="w-4 h-4 text-success" />
          </div>
        </div>
        
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "45%" }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-magenta to-purple rounded-l-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "55%" }}
            transition={{ duration: 1, delay: 0.6 }}
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-success to-cyan rounded-r-full"
          />
          <div className="absolute left-1/2 top-0 h-full w-1 bg-background transform -translate-x-1/2" />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            R$ {totalLazer.toLocaleString("pt-BR")} / {totalBudget.toLocaleString("pt-BR")}
          </span>
          <span className="text-xs text-success font-medium">
            R$ {savings.toLocaleString("pt-BR")} guardado
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {leisureCategories.map((category, index) => {
          const percentage = (category.value / category.budget) * 100;
          const isOverBudget = percentage > 100;
          const Icon = category.icon;

          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  category.color === "cyan" && "bg-cyan/20 text-cyan",
                  category.color === "magenta" && "bg-magenta/20 text-magenta",
                  category.color === "purple" && "bg-purple/20 text-purple",
                  category.color === "success" && "bg-success/20 text-success"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{category.name}</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isOverBudget ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    R$ {category.value} / {category.budget}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      category.color === "cyan" && "bg-cyan",
                      category.color === "magenta" && "bg-magenta",
                      category.color === "purple" && "bg-purple",
                      category.color === "success" && "bg-success",
                      isOverBudget && "bg-destructive"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
