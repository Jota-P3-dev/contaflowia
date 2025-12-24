import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Pencil, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "./EmptyState";
import { EditTransactionModal } from "./EditTransactionModal";
import { useEditNotification } from "@/contexts/EditNotificationContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category_id: string | null;
  category?: { name: string } | null;
}

export function TransactionsTable() {
  const { user } = useAuth();
  const { notifyEdit } = useEditNotification();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(name)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleNotifyAI = (action: "create" | "update" | "delete", itemName: string, oldValue?: number, newValue?: number) => {
    notifyEdit({
      type: "transaction",
      action,
      itemName,
      oldValue,
      newValue,
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded-xl w-1/3" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="h-12 bg-muted rounded-xl" />
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Transações Recentes
            </h3>
            <p className="text-sm text-muted-foreground">
              Últimas movimentações da sua conta
            </p>
          </div>
          <button 
            onClick={handleAddNew}
            className="text-sm text-primary hover:underline"
          >
            + Nova
          </button>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma transação"
            description="Registre suas receitas e despesas para acompanhar suas finanças"
            actionLabel="Adicionar transação"
            onAction={handleAddNew}
            variant="cyan"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border/50">
                  <th className="pb-3 font-medium">Descrição</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Categoria</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                  <th className="pb-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors group"
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            transaction.type === "income"
                              ? "bg-success/20"
                              : "bg-destructive/20"
                          )}
                        >
                          {transaction.type === "income" ? (
                            <ArrowDownLeft className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <span className="font-medium text-foreground">
                          {transaction.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 hidden sm:table-cell">
                      <span className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                        {transaction.category?.name || "Sem categoria"}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={cn(
                          "font-semibold",
                          transaction.type === "income"
                            ? "text-success"
                            : "text-foreground"
                        )}
                      >
                        {transaction.type === "income" ? "+" : "-"} R${" "}
                        {Number(transaction.amount).toLocaleString("pt-BR")}
                      </span>
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleEdit(transaction)}
                        className="p-1 hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <EditTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={editingTransaction}
        onSave={fetchTransactions}
        onNotifyAI={handleNotifyAI}
      />
    </>
  );
}
