import { motion } from "framer-motion";
import { Bell, Search, Menu, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TelegramConnect } from "./TelegramConnect";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const fullName = user?.user_metadata?.name || "";
  const preferredName = user?.user_metadata?.preferred_name;
  const displayName = preferredName || fullName.split(" ")[0] || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong sticky top-0 z-40 border-b border-border/50"
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan via-purple to-magenta flex items-center justify-center">
                <span className="text-xl font-bold text-background">C</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold gradient-text">ContaFlow IA</h1>
                <p className="text-xs text-muted-foreground">
                  Seu parceiro financeiro
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar transações, metas..."
                className="w-full bg-muted/50 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
              <span className="text-sm text-foreground">Dezembro 2024</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Telegram Connect */}
            <TelegramConnect />

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-magenta rounded-full" />
            </button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan/30 to-purple/30 flex items-center justify-center">
                    <span className="text-sm font-semibold text-foreground">{initials}</span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
