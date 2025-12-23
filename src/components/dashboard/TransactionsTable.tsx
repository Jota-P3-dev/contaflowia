import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

const transactions: Transaction[] = [
  {
    id: "1",
    description: "Salário",
    category: "Renda",
    amount: 8500,
    type: "income",
    date: "15 Dez",
  },
  {
    id: "2",
    description: "Aluguel",
    category: "Moradia",
    amount: 1800,
    type: "expense",
    date: "10 Dez",
  },
  {
    id: "3",
    description: "Freelance Design",
    category: "Renda Extra",
    amount: 2200,
    type: "income",
    date: "08 Dez",
  },
  {
    id: "4",
    description: "Supermercado",
    category: "Alimentação",
    amount: 650,
    type: "expense",
    date: "05 Dez",
  },
  {
    id: "5",
    description: "Academia",
    category: "Saúde",
    amount: 120,
    type: "expense",
    date: "01 Dez",
  },
];

export function TransactionsTable() {
  return (
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
        <button className="text-sm text-primary hover:underline">Ver todas</button>
      </div>

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
                className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
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
                    {transaction.category}
                  </span>
                </td>
                <td className="py-4 text-sm text-muted-foreground">
                  {transaction.date}
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
                    {transaction.amount.toLocaleString("pt-BR")}
                  </span>
                </td>
                <td className="py-4">
                  <button className="p-1 hover:bg-muted rounded-md transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
