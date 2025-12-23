import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FinanceChart } from "@/components/dashboard/FinanceChart";
import { GoalsSection } from "@/components/dashboard/GoalsSection";
import { LeisureBalance } from "@/components/dashboard/LeisureBalance";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { Wallet, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>FinanceAI - Dashboard Financeiro Inteligente</title>
        <meta
          name="description"
          content="Gerencie suas finanças pessoais com inteligência artificial. Acompanhe receitas, despesas, metas e lazer em um só lugar."
        />
      </Helmet>

      <div className="min-h-screen">
        <Header />

        <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Saldo Atual"
              value="R$ 12.450"
              subtitle="Melhor mês:"
              subtitleValue="R$ 15.200 (Nov)"
              icon={Wallet}
              trend="up"
              trendValue="8%"
              variant="cyan"
              delay={0}
            />
            <MetricCard
              title="Receita do Mês"
              value="R$ 10.700"
              subtitle="Média mensal:"
              subtitleValue="R$ 9.850"
              icon={TrendingUp}
              trend="up"
              trendValue="12%"
              variant="success"
              delay={0.1}
            />
            <MetricCard
              title="Despesas do Mês"
              value="R$ 4.650"
              subtitle="Meta:"
              subtitleValue="R$ 5.000"
              icon={TrendingDown}
              trend="down"
              trendValue="5%"
              variant="magenta"
              delay={0.2}
            />
            <MetricCard
              title="Taxa de Economia"
              value="56%"
              subtitle="Melhor mês:"
              subtitleValue="62% (Out)"
              icon={Target}
              variant="purple"
              delay={0.3}
            />
          </div>

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
