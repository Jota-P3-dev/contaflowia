import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  subtitleValue?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "cyan" | "magenta" | "purple" | "success";
  delay?: number;
}

const variantStyles = {
  cyan: {
    gradient: "from-cyan to-cyan-glow",
    glow: "glow-cyan",
    iconBg: "bg-cyan/20",
    iconColor: "text-cyan",
  },
  magenta: {
    gradient: "from-magenta to-magenta-glow",
    glow: "glow-magenta",
    iconBg: "bg-magenta/20",
    iconColor: "text-magenta",
  },
  purple: {
    gradient: "from-purple to-purple-glow",
    glow: "glow-purple",
    iconBg: "bg-purple/20",
    iconColor: "text-purple",
  },
  success: {
    gradient: "from-success to-cyan",
    glow: "glow-cyan",
    iconBg: "bg-success/20",
    iconColor: "text-success",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  subtitleValue,
  icon: Icon,
  trend,
  trendValue,
  variant = "cyan",
  delay = 0,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "glass rounded-2xl p-6 card-glow group relative overflow-hidden",
        "hover:border-primary/30 transition-all duration-300"
      )}
    >
      {/* Background gradient accent */}
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 opacity-20 blur-3xl",
          `bg-gradient-to-br ${styles.gradient}`
        )}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              styles.iconBg
            )}
          >
            <Icon className={cn("w-6 h-6", styles.iconColor)} />
          </div>
          {trend && trendValue && (
            <span
              className={cn(
                "text-sm font-medium px-2 py-1 rounded-full",
                trend === "up" && "text-success bg-success/20",
                trend === "down" && "text-destructive bg-destructive/20",
                trend === "neutral" && "text-muted-foreground bg-muted"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <h3
          className={cn(
            "text-3xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent",
            styles.gradient
          )}
        >
          {value}
        </h3>

        {subtitle && subtitleValue && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{subtitle}</span>
            <span className="text-foreground font-medium">{subtitleValue}</span>
          </div>
        )}
      </div>

      {/* Sparkline placeholder */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
        <svg
          viewBox="0 0 100 30"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={cn(variant === "cyan" && "stop-cyan", variant === "magenta" && "stop-magenta", variant === "purple" && "stop-purple", variant === "success" && "stop-success")} style={{ stopColor: `hsl(var(--${variant === "success" ? "success" : variant}))` }} />
              <stop offset="100%" className="stop-transparent" style={{ stopColor: `hsl(var(--${variant === "success" ? "cyan" : variant}-glow))` }} />
            </linearGradient>
          </defs>
          <path
            d="M0,25 Q10,20 20,22 T40,18 T60,15 T80,8 T100,5"
            fill="none"
            stroke={`url(#gradient-${variant})`}
            strokeWidth="2"
          />
          <path
            d="M0,25 Q10,20 20,22 T40,18 T60,15 T80,8 T100,5 L100,30 L0,30 Z"
            fill={`url(#gradient-${variant})`}
            opacity="0.2"
          />
        </svg>
      </div>
    </motion.div>
  );
}
