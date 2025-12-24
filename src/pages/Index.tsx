import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FinanceChart } from "@/components/dashboard/FinanceChart";
import { GoalsSection } from "@/components/dashboard/GoalsSection";
import { LeisureBalance } from "@/components/dashboard/LeisureBalance";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { DebtProgress } from "@/components/dashboard/DebtProgress";
import { Wallet, TrendingUp, TrendingDown, Target, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  paidDebt: number;
  leisureRemaining: number;
  leisureTotal: number;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    totalDebt: 0,
    paidDebt: 0,
    leisureRemaining: 0,
    leisureTotal: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }

      await fetchDashboardData();
    };

    checkOnboarding();
  }, [user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const [incomesResult, expensesResult, debtsResult, leisureResult] = await Promise.all([
        supabase.from("income_sources").select("amount").eq("user_id", user.id),
        supabase.from("fixed_expenses").select("amount").eq("user_id", user.id),
        supabase.from("debts").select("total_amount, remaining_amount, is_paid").eq("user_id", user.id),
        supabase.from("leisure_budget").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const totalIncome = (incomesResult.data || []).reduce((sum, i) => sum + Number(i.amount), 0);
      const totalExpenses = (expensesResult.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
      
      const debts = debtsResult.data || [];
      const totalDebt = debts.reduce((sum, d) => sum + Number(d.total_amount), 0);
      const paidDebt = debts.reduce((sum, d) => {
        return sum + (Number(d.total_amount) - Number(d.remaining_amount));
      }, 0);

      const leisure = leisureResult.data;
      const leisureTotal = Number(leisure?.monthly_amount || 0);
      const leisureRemaining = leisureTotal - Number(leisure?.spent_this_month || 0);

      setData({
        totalIncome,
        totalExpenses,
        totalDebt,
        paidDebt,
        leisureRemaining: Math.max(0, leisureRemaining),
        leisureTotal,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = data.totalIncome - data.totalExpenses;
  const savingsRate = data.totalIncome > 0 ? ((data.totalIncome - data.totalExpenses) / data.totalIncome) * 100 : 0;
  const debtProgress = data.totalDebt > 0 ? (data.paidDebt / data.totalDebt) * 100 : 100;

  return (
    <>
      <Helmet>
        <title>ContaFlow IA - Dashboard Financeiro Inteligente</title>
        <meta
          name="description"
          content="Controle suas finanças com o FIN, seu assistente financeiro pessoal. Acompanhe dívidas, metas e lazer protegido."
        />
      </Helmet>

      <div className="min-h-screen">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Saldo Disponível"
              value={`R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              subtitle="Renda - Gastos fixos"
              icon={Wallet}
              trend={balance >= 0 ? "up" : "down"}
              variant="cyan"
              delay={0}
            />
            <MetricCard
              title="Renda Mensal"
              value={`R$ ${data.totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              subtitle="Total de fontes"
              icon={TrendingUp}
              trend="up"
              variant="success"
              delay={0.1}
            />
            <MetricCard
              title="Gastos Fixos"
              value={`R$ ${data.totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              subtitle="Compromissos mensais"
              icon={TrendingDown}
              variant="magenta"
              delay={0.2}
            />
            <MetricCard
              title="Taxa de Economia"
              value={`${savingsRate.toFixed(0)}%`}
              subtitle={savingsRate >= 20 ? "Excelente!" : "Vamos melhorar!"}
              icon={Target}
              variant="purple"
              delay={0.3}
            />
          </div>

          {/* Debt Progress - Full Width */}
          {data.totalDebt > 0 && (
            <DebtProgress 
              totalDebt={data.totalDebt} 
              paidDebt={data.paidDebt} 
              progress={debtProgress} 
            />
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart - 2 columns */}
            <div className="lg:col-span-2">
              <FinanceChart />
            </div>

            {/* Goals - 1 column */}
            <div className="lg:col-span-1">
              <GoalsSection />
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transactions - 2 columns */}
            <div className="lg:col-span-2">
              <TransactionsTable />
            </div>

            {/* Leisure Balance - 1 column */}
            <div className="lg:col-span-1">
              <LeisureBalance />
            </div>
          </div>
        </main>

        {/* AI Assistant */}
        <AIAssistant />
      </div>
    </>
  );
};

export default Index;
