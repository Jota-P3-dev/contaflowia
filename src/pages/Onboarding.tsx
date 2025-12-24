import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { 
  Sparkles, ArrowRight, ArrowLeft, Loader2, Plus, X,
  User, Wallet, Receipt, CreditCard, Target, Heart
} from "lucide-react";

interface IncomeSource {
  name: string;
  amount: string;
}

interface FixedExpense {
  name: string;
  amount: string;
}

interface Debt {
  name: string;
  totalAmount: string;
  monthlyPayment: string;
}

interface Goal {
  name: string;
  targetAmount: string;
}

const steps = [
  { id: 1, title: "Boas-vindas", icon: User },
  { id: 2, title: "Sua renda", icon: Wallet },
  { id: 3, title: "Gastos fixos", icon: Receipt },
  { id: 4, title: "Dívidas", icon: CreditCard },
  { id: 5, title: "Sonhos e lazer", icon: Target },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([{ name: "", amount: "" }]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([{ name: "", amount: "" }]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([{ name: "", targetAmount: "" }]);
  const [leisureBudget, setLeisureBudget] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const finMessages = [
    "Oi! Sou o FIN 👋 Vamos começar essa jornada juntos? Me conta um pouco sobre você!",
    "Legal te conhecer! Agora me conta: como entra dinheiro na sua vida? Pode ser salário, freelas, pensão...",
    "Perfeito! Agora vamos ver o que sai todo mês. Sem julgamentos aqui, tá? 😊",
    "Sei que essa parte pode ser difícil. Respira, tô aqui pra ajudar. Quais dívidas você tem hoje?",
    "O mais importante: o que te faz feliz? Seus sonhos, suas metas... e quanto você quer proteger pra lazer? 🌟"
  ];

  const addItem = (type: "income" | "expense" | "debt" | "goal") => {
    switch (type) {
      case "income":
        setIncomeSources([...incomeSources, { name: "", amount: "" }]);
        break;
      case "expense":
        setFixedExpenses([...fixedExpenses, { name: "", amount: "" }]);
        break;
      case "debt":
        setDebts([...debts, { name: "", totalAmount: "", monthlyPayment: "" }]);
        break;
      case "goal":
        setGoals([...goals, { name: "", targetAmount: "" }]);
        break;
    }
  };

  const removeItem = (type: "income" | "expense" | "debt" | "goal", index: number) => {
    switch (type) {
      case "income":
        setIncomeSources(incomeSources.filter((_, i) => i !== index));
        break;
      case "expense":
        setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
        break;
      case "debt":
        setDebts(debts.filter((_, i) => i !== index));
        break;
      case "goal":
        setGoals(goals.filter((_, i) => i !== index));
        break;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Calculate total monthly income
      const totalIncome = incomeSources.reduce((sum, source) => {
        return sum + (parseFloat(source.amount.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0);
      }, 0);

      // Update profile
      await supabase
        .from("profiles")
        .update({
          name,
          monthly_income: totalIncome,
          onboarding_completed: true
        })
        .eq("user_id", user.id);

      // Insert income sources
      const validIncomeSources = incomeSources.filter(s => s.name && s.amount);
      if (validIncomeSources.length > 0) {
        await supabase.from("income_sources").insert(
          validIncomeSources.map(source => ({
            user_id: user.id,
            name: source.name,
            amount: parseFloat(source.amount.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
          }))
        );
      }

      // Insert fixed expenses
      const validExpenses = fixedExpenses.filter(e => e.name && e.amount);
      if (validExpenses.length > 0) {
        await supabase.from("fixed_expenses").insert(
          validExpenses.map(expense => ({
            user_id: user.id,
            name: expense.name,
            amount: parseFloat(expense.amount.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
          }))
        );
      }

      // Insert debts
      const validDebts = debts.filter(d => d.name && d.totalAmount);
      if (validDebts.length > 0) {
        await supabase.from("debts").insert(
          validDebts.map(debt => ({
            user_id: user.id,
            name: debt.name,
            total_amount: parseFloat(debt.totalAmount.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0,
            remaining_amount: parseFloat(debt.totalAmount.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0,
            monthly_payment: parseFloat(debt.monthlyPayment.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
          }))
        );
      }

      // Insert goals
      const validGoals = goals.filter(g => g.name && g.targetAmount);
      if (validGoals.length > 0) {
        await supabase.from("goals").insert(
          validGoals.map(goal => ({
            user_id: user.id,
            name: goal.name,
            target_amount: parseFloat(goal.targetAmount.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0
          }))
        );
      }

      // Insert leisure budget
      const leisureAmount = parseFloat(leisureBudget.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
      if (leisureAmount > 0) {
        await supabase.from("leisure_budget").insert({
          user_id: user.id,
          monthly_amount: leisureAmount
        });
      }

      toast({
        title: "Parabéns! 🎉",
        description: "Seu perfil financeiro foi criado. Vamos começar sua jornada!"
      });

      navigate("/");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="name">Como posso te chamar?</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label>Suas fontes de renda</Label>
            {incomeSources.map((source, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Ex: Salário, Freelance"
                  value={source.name}
                  onChange={(e) => {
                    const updated = [...incomeSources];
                    updated[index].name = e.target.value;
                    setIncomeSources(updated);
                  }}
                />
                <Input
                  placeholder="R$ 0,00"
                  value={source.amount}
                  onChange={(e) => {
                    const updated = [...incomeSources];
                    updated[index].amount = e.target.value;
                    setIncomeSources(updated);
                  }}
                  className="w-32"
                />
                {incomeSources.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem("income", index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => addItem("income")}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar fonte
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label>Gastos fixos mensais</Label>
            {fixedExpenses.map((expense, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Ex: Aluguel, Internet"
                  value={expense.name}
                  onChange={(e) => {
                    const updated = [...fixedExpenses];
                    updated[index].name = e.target.value;
                    setFixedExpenses(updated);
                  }}
                />
                <Input
                  placeholder="R$ 0,00"
                  value={expense.amount}
                  onChange={(e) => {
                    const updated = [...fixedExpenses];
                    updated[index].amount = e.target.value;
                    setFixedExpenses(updated);
                  }}
                  className="w-32"
                />
                {fixedExpenses.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem("expense", index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => addItem("expense")}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar gasto
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label>Suas dívidas atuais (pode pular se não tiver)</Label>
            {debts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma dívida ainda. Isso é ótimo! 🎉</p>
              </div>
            ) : (
              debts.map((debt, index) => (
                <div key={index} className="glass rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <Input
                      placeholder="Ex: Cartão de crédito"
                      value={debt.name}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].name = e.target.value;
                        setDebts(updated);
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem("debt", index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Valor total"
                      value={debt.totalAmount}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].totalAmount = e.target.value;
                        setDebts(updated);
                      }}
                    />
                    <Input
                      placeholder="Parcela mensal"
                      value={debt.monthlyPayment}
                      onChange={(e) => {
                        const updated = [...debts];
                        updated[index].monthlyPayment = e.target.value;
                        setDebts(updated);
                      }}
                    />
                  </div>
                </div>
              ))
            )}
            <Button
              variant="outline"
              onClick={() => addItem("debt")}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar dívida
            </Button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Seus sonhos e objetivos</Label>
              {goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Ex: Viagem, Casa própria"
                    value={goal.name}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[index].name = e.target.value;
                      setGoals(updated);
                    }}
                  />
                  <Input
                    placeholder="Valor"
                    value={goal.targetAmount}
                    onChange={(e) => {
                      const updated = [...goals];
                      updated[index].targetAmount = e.target.value;
                      setGoals(updated);
                    }}
                    className="w-32"
                  />
                  {goals.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem("goal", index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addItem("goal")}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar sonho
              </Button>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-magenta" />
                Lazer protegido do mês
              </Label>
              <p className="text-sm text-muted-foreground">
                Quanto você quer reservar para se divertir sem culpa?
              </p>
              <Input
                placeholder="R$ 0,00"
                value={leisureBudget}
                onChange={(e) => setLeisureBudget(e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Onboarding - ContaFlow IA</title>
        <meta name="description" content="Configure seu perfil financeiro no ContaFlow IA" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`w-12 h-1.5 rounded-full transition-colors ${
                  step.id <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* FIN Message */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-background">FIN</span>
            </div>
            <p className="text-sm text-foreground">{finMessages[currentStep - 1]}</p>
          </motion.div>

          {/* Form Card */}
          <div className="glass-strong rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-5 h-5 text-primary" />;
              })()}
              <h2 className="text-lg font-semibold text-foreground">
                {steps[currentStep - 1].title}
              </h2>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="min-h-[200px]"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-cyan to-purple hover:opacity-90"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan to-purple hover:opacity-90"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Começar!
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
