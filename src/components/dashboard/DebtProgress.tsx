import { motion } from "framer-motion";
import { CreditCard, TrendingDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebtProgressProps {
  totalDebt: number;
  paidDebt: number;
  progress: number;
}

export function DebtProgress({ totalDebt, paidDebt, progress }: DebtProgressProps) {
  const remaining = totalDebt - paidDebt;
  
  const getMessage = () => {
    if (progress >= 100) return "🎉 Parabéns! Você está livre das dívidas!";
    if (progress >= 75) return "🚀 Quase lá! A liberdade financeira está próxima!";
    if (progress >= 50) return "💪 Metade do caminho! Continue assim!";
    if (progress >= 25) return "📈 Bom progresso! Cada pagamento conta!";
    return "🌱 O primeiro passo é o mais importante. Vamos juntos!";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-magenta/20 to-purple/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-magenta" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Jornada para Liberdade</h3>
            <p className="text-sm text-muted-foreground">Progresso de quitação de dívidas</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">{progress.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">quitado</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            progress >= 100
              ? "bg-gradient-to-r from-success to-cyan"
              : "bg-gradient-to-r from-cyan to-purple"
          )}
        />
        {progress < 100 && (
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
            style={{ left: `calc(${Math.min(progress, 95)}% - 12px)` }}
          >
            <Sparkles className="w-3 h-3 text-primary" />
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            R$ {paidDebt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-success">Já pagou</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            R$ {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">Restante</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            R$ {totalDebt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">Total inicial</p>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="glass rounded-xl p-3 text-center">
        <p className="text-sm text-foreground">{getMessage()}</p>
      </div>
    </motion.div>
  );
}
