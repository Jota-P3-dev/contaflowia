import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSave: () => void;
  onNotifyAI: (action: "create" | "update" | "delete", itemName: string, oldValue?: number, newValue?: number) => void;
}

export function EditTransactionModal({ isOpen, onClose, transaction, onSave, onNotifyAI }: EditTransactionModalProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchCategories();
    }
  }, [user, isOpen, type]);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setDate(transaction.date);
      setCategoryId(transaction.category_id || "");
    } else {
      setDescription("");
      setAmount("");
      setType("expense");
      setDate(new Date().toISOString().split("T")[0]);
      setCategoryId("");
    }
  }, [transaction, isOpen]);

  const fetchCategories = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type);

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const transactionData = {
        description,
        amount: parseFloat(amount),
        type,
        date,
        category_id: categoryId || null,
        user_id: user.id,
      };

      if (transaction) {
        const { error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", transaction.id);

        if (error) throw error;
        toast.success("Transação atualizada!");
        onNotifyAI("update", description, transaction.amount, parseFloat(amount));
      } else {
        const { error } = await supabase.from("transactions").insert(transactionData);

        if (error) throw error;
        toast.success("Transação criada!");
        onNotifyAI("create", description);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", transaction.id);
      if (error) throw error;
      toast.success("Transação removida!");
      onNotifyAI("delete", transaction.description);
      onSave();
      onClose();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erro ao remover transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md glass-strong rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {transaction ? "Editar Transação" : "Nova Transação"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("expense")}
                    className={`flex-1 py-2 rounded-xl border transition-all ${
                      type === "expense"
                        ? "border-destructive bg-destructive/20 text-foreground"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("income")}
                    className={`flex-1 py-2 rounded-xl border transition-all ${
                      type === "income"
                        ? "border-success bg-success/20 text-foreground"
                        : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Supermercado"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="150.00"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Categoria
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {transaction && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-3 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Salvando..." : transaction ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
