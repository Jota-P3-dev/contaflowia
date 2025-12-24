import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Copy, Check, RefreshCw, X, ExternalLink, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
export function TelegramConnect() {
  const {
    user
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  useEffect(() => {
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);
  const checkConnectionStatus = async () => {
    if (!user) return;
    const {
      data: profile
    } = await supabase.from("profiles").select("telegram_chat_id").eq("user_id", user.id).maybeSingle();
    setIsConnected(!!profile?.telegram_chat_id);
  };
  const generateSecureCode = (): string => {
    // Use cryptographically secure random generation
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    // Convert to base36 and take 8 characters for better security
    return Array.from(array).map(b => (b % 36).toString(36)).join('').toUpperCase().substring(0, 8);
  };
  const generateLinkCode = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      // Delete any existing unused codes for this user
      await supabase.from("telegram_link_codes").delete().eq("user_id", user.id).eq("used", false);

      // Generate a new 8-character cryptographically secure code
      const code = generateSecureCode();
      const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const {
        error
      } = await supabase.from("telegram_link_codes").insert({
        user_id: user.id,
        code: code,
        expires_at: expiresAtDate.toISOString()
      });
      if (error) {
        console.error("Error generating code:", error);
        toast.error("Erro ao gerar código. Tente novamente.");
        return;
      }
      setLinkCode(code);
      setExpiresAt(expiresAtDate);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao gerar código. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };
  const copyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(`/vincular ${linkCode}`);
      setCopied(true);
      toast.success("Comando copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const disconnectTelegram = async () => {
    if (!user) return;
    const {
      error
    } = await supabase.from("profiles").update({
      telegram_chat_id: null
    }).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao desconectar. Tente novamente.");
      return;
    }
    setIsConnected(false);
    toast.success("Telegram desconectado!");
  };
  const formatTimeRemaining = () => {
    if (!expiresAt) return "";
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return "Expirado";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff % 60000 / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors" onClick={() => {
        setIsOpen(true);
        if (!isConnected && !linkCode) {
          generateLinkCode();
        }
      }}>
          <Type className="w-5 h-5 text-muted-foreground" />
          {isConnected && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Conectar Telegram
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isConnected ? <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Telegram Conectado!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Você pode conversar com o FIN diretamente no Telegram.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={disconnectTelegram} className="text-destructive hover:text-destructive">
                  <X className="w-4 h-4 mr-1" />
                  Desconectar
                </Button>
                <Button size="sm" onClick={() => window.open("https://t.me/F1747_bot", "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Abrir Bot
                </Button>
              </div>
            </motion.div> : <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vincule sua conta para conversar com o FIN pelo Telegram.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    1
                  </span>
                  <span className="text-foreground">
                    Abra o bot{" "}
                    <a href="https://t.me/F1747_bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                      @ContaFlowIA_bot
                    </a>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    2
                  </span>
                  <span className="text-foreground">Envie o comando abaixo:</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isGenerating ? <motion.div key="loading" initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} exit={{
              opacity: 0
            }} className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                  </motion.div> : linkCode ? <motion.div key="code" initial={{
              opacity: 0,
              scale: 0.95
            }} animate={{
              opacity: 1,
              scale: 1
            }} className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors" onClick={copyCode}>
                      <code className="text-lg font-mono font-bold text-foreground">
                        /vincular {linkCode}
                      </code>
                      <button className="p-1.5 hover:bg-background rounded transition-colors">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Expira em: {formatTimeRemaining()}</span>
                      <button onClick={generateLinkCode} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        Novo código
                      </button>
                    </div>
                  </motion.div> : null}
              </AnimatePresence>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Dica:</strong> Após vincular, você pode registrar gastos
                rapidamente pelo Telegram! Exemplo: "gastei 50 no mercado"
              </div>
            </motion.div>}
        </div>
      </DialogContent>
    </Dialog>;
}