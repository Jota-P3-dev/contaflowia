import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", receita: 4200, despesas: 3100 },
  { month: "Fev", receita: 4800, despesas: 3400 },
  { month: "Mar", receita: 5200, despesas: 3200 },
  { month: "Abr", receita: 4900, despesas: 3600 },
  { month: "Mai", receita: 5800, despesas: 3300 },
  { month: "Jun", receita: 6200, despesas: 3800 },
  { month: "Jul", receita: 5900, despesas: 3500 },
  { month: "Ago", receita: 6800, despesas: 4100 },
  { month: "Set", receita: 7200, despesas: 4000 },
  { month: "Out", receita: 6900, despesas: 4200 },
  { month: "Nov", receita: 7800, despesas: 4500 },
  { month: "Dez", receita: 8500, despesas: 4800 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl p-4 border border-border/50">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-cyan">Receita:</span>{" "}
            <span className="font-medium">
              R$ {payload[0]?.value?.toLocaleString("pt-BR")}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-magenta">Despesas:</span>{" "}
            <span className="font-medium">
              R$ {payload[1]?.value?.toLocaleString("pt-BR")}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function FinanceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl p-6 h-[400px]"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Evolução Financeira
          </h3>
          <p className="text-sm text-muted-foreground">
            Receitas vs Despesas nos últimos 12 meses
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan" />
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-magenta" />
            <span className="text-sm text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(186 100% 50%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(186 100% 50%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(320 100% 60%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(320 100% 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(222 30% 20%)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            stroke="hsl(215 20% 65%)"
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(215 20% 65%)"
            tick={{ fill: "hsl(215 20% 65%)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="hsl(186 100% 50%)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorReceita)"
          />
          <Area
            type="monotone"
            dataKey="despesas"
            stroke="hsl(320 100% 60%)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorDespesas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
