import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEditNotification } from "@/contexts/EditNotificationContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Oi! Sou o FIN, seu assistente financeiro 👋\n\nEstou aqui pra te ajudar a conquistar sua liberdade financeira. Pode me perguntar qualquer coisa sobre suas finanças!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();
  const { pendingNotification, clearNotification } = useEditNotification();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detectar mudanças e gerar mensagem automática
  useEffect(() => {
    if (pendingNotification) {
      const { type, action, itemName, oldValue, newValue } = pendingNotification;
      
      let aiMessage = "";
      
      const typeLabels: Record<string, string> = {
        goal: "objetivo",
        transaction: "transação",
        leisure: "orçamento de lazer",
      };
      
      const typeLabel = typeLabels[type] || type;
      
      if (action === "create") {
        aiMessage = `Percebi que você criou um novo ${typeLabel}: "${itemName}" 🎉\n\nQuer me contar mais sobre essa decisão? Posso te ajudar a planejar melhor!`;
      } else if (action === "update") {
        if (oldValue !== undefined && newValue !== undefined) {
          aiMessage = `Vi que você ajustou ${typeLabel === "objetivo" ? "o" : "a"} ${typeLabel} "${itemName}" de R$ ${Number(oldValue).toLocaleString("pt-BR")} para R$ ${Number(newValue).toLocaleString("pt-BR")} 📝\n\nO que motivou essa mudança? Posso te ajudar a entender o impacto no seu planejamento!`;
        } else {
          aiMessage = `Vi que você atualizou ${typeLabel === "objetivo" ? "o" : "a"} ${typeLabel} "${itemName}" 📝\n\nQuer me contar sobre a mudança?`;
        }
      } else if (action === "delete") {
        aiMessage = `Notei que você removeu ${typeLabel === "objetivo" ? "o" : "a"} ${typeLabel} "${itemName}" 🗑️\n\nFoi uma decisão planejada? Posso te ajudar a reorganizar suas finanças se precisar!`;
      }

      if (aiMessage) {
        const newMessage: Message = {
          id: `notification-${Date.now()}`,
          role: "assistant",
          content: aiMessage,
        };
        setMessages((prev) => [...prev, newMessage]);
        setHasNotification(true);
        
        // Abrir o chat automaticamente se estiver fechado
        if (!isOpen) {
          setTimeout(() => setIsOpen(true), 500);
        }
      }
      
      clearNotification();
    }
  }, [pendingNotification, clearNotification, isOpen]);

  // Limpar notificação quando abrir o chat
  useEffect(() => {
    if (isOpen && hasNotification) {
      setHasNotification(false);
    }
  }, [isOpen, hasNotification]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("stream-")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          { id: `stream-${Date.now()}`, role: "assistant", content: assistantContent },
        ];
      });
    };

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        upsertAssistant("Você precisa estar logado para usar o assistente. Faça login novamente!");
        setIsLoading(false);
        return;
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          upsertAssistant("Estou recebendo muitas mensagens agora. Tente novamente em alguns segundos! 🙏");
        } else if (response.status === 402) {
          upsertAssistant("Ops! Parece que os créditos de IA acabaram. Entre em contato com o suporte.");
        } else {
          upsertAssistant("Desculpe, tive um problema ao processar sua mensagem. Tente novamente!");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      upsertAssistant("Desculpe, tive um problema de conexão. Tente novamente!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
          "bg-gradient-to-br from-cyan via-purple to-magenta",
          "flex items-center justify-center shadow-lg glow-cyan",
          "hover:scale-110 transition-transform duration-300",
          isOpen && "hidden"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-lg font-bold text-background">FIN</span>
        {hasNotification && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]",
              "glass-strong rounded-2xl overflow-hidden shadow-2xl",
              "border border-primary/20"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border/50 bg-gradient-to-r from-cyan/10 via-purple/10 to-magenta/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
                    <span className="text-sm font-bold text-background">FIN</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">FIN</h4>
                    <p className="text-xs text-muted-foreground">
                      Seu assistente financeiro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/50 text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Pergunte sobre suas finanças..."
                  disabled={isLoading}
                  className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan to-purple flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-background" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
