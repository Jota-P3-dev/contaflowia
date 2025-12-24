import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, eachMonthOfInterval, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthlyData {
  month: string;
  receita: number;
  despesas: number;
}

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
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountCreatedAt, setAccountCreatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user]);

  const fetchChartData = async () => {
    if (!user) return;

    try {
      // Buscar data de criação do perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
      setAccountCreatedAt(createdAt);

      const startDate = startOfMonth(createdAt);
      const now = new Date();

      // Buscar transações desde a criação da conta
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"));

      // Gerar array de meses desde a criação até agora
      const months = eachMonthOfInterval({ start: startDate, end: now });

      // Agregar transações por mês
      const monthlyData: MonthlyData[] = months.map((monthDate) => {
        const monthTransactions = (transactions || []).filter((t) =>
          isSameMonth(new Date(t.date), monthDate)
        );

        const receita = monthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const despesas = monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          month: format(monthDate, "MMM", { locale: ptBR }),
          receita,
          despesas,
        };
      });

      setData(monthlyData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = format(new Date(), "MMMM yyyy", { locale: ptBR });
  const startMonth = accountCreatedAt 
    ? format(accountCreatedAt, "MMMM yyyy", { locale: ptBR })
    : "";

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass rounded-2xl p-6 h-[400px]"
      >
        <div className="animate-pulse h-full flex flex-col">
          <div className="h-10 bg-muted rounded-xl w-1/3 mb-4" />
          <div className="flex-1 bg-muted rounded-xl" />
        </div>
      </motion.div>
    );
  }

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
          <p className="text-sm text-muted-foreground capitalize">
            {data.length > 1 
              ? `Desde ${startMonth}` 
              : currentMonth}
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

      {data.length === 0 || data.every(d => d.receita === 0 && d.despesas === 0) ? (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Adicione transações para visualizar seu histórico
          </p>
        </div>
      ) : (
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
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value.toString()}
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
      )}
    </motion.div>
  );
}
