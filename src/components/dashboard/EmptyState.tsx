import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "cyan" | "magenta" | "purple" | "success";
}

const variantStyles = {
  cyan: "bg-cyan/20 text-cyan",
  magenta: "bg-magenta/20 text-magenta",
  purple: "bg-purple/20 text-purple",
  success: "bg-success/20 text-success",
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "purple",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-8 px-4 text-center"
    >
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
          variantStyles[variant]
        )}
      >
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-[250px] mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
