import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth, UserSignupData } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, Calendar, Phone, MapPin, Heart } from "lucide-react";
import { z } from "zod";
import { brazilianStates, genderOptions } from "@/data/brazilianStates";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter no mínimo 6 caracteres");
const nameSchema = z.string().min(3, "Nome deve ter no mínimo 3 caracteres");
const phoneSchema = z.string().regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, "Telefone inválido. Use o formato (XX) XXXXX-XXXX");

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : "";
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

interface FormErrors {
  email?: string;
  password?: string;
  name?: string;
  preferredName?: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  state?: string;
  city?: string;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get capital based on selected state
  const stateCapital = useMemo(() => {
    const state = brazilianStates.find(s => s.uf === selectedState);
    return state?.capital || "";
  }, [selectedState]);

  // When state changes, auto-select capital
  const handleStateChange = (value: string) => {
    setSelectedState(value);
    const state = brazilianStates.find(s => s.uf === value);
    if (state) {
      setSelectedCity(state.capital);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }

      if (!gender) {
        newErrors.gender = "Selecione uma opção";
      }

      if (!birthDate) {
        newErrors.birthDate = "Data de nascimento é obrigatória";
      } else {
        const age = calculateAge(birthDate);
        if (age < 18) {
          newErrors.birthDate = "Você deve ter pelo menos 18 anos";
        }
      }

      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }

      if (!selectedState) {
        newErrors.state = "Selecione um estado";
      }

      if (!selectedCity) {
        newErrors.city = "Selecione uma cidade";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Erro ao entrar",
              description: "Email ou senha incorretos",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro ao entrar",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Bem-vindo de volta!",
            description: "Login realizado com sucesso"
          });
          navigate("/");
        }
      } else {
        const userData: UserSignupData = {
          name,
          preferredName: preferredName || undefined,
          gender,
          birthDate,
          phone,
          state: selectedState,
          city: selectedCity,
        };

        const { error } = await signUp(email, password, userData);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Erro ao criar conta",
              description: "Este email já está cadastrado. Tente fazer login.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erro ao criar conta",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Conta criada!",
            description: "Bem-vindo ao ContaFlow IA!"
          });
          navigate("/onboarding");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  return (
    <>
      <Helmet>
        <title>{isLogin ? "Entrar" : "Criar conta"} - ContaFlow IA</title>
        <meta name="description" content="Acesse sua conta no ContaFlow IA e comece a controlar suas finanças com inteligência artificial." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan via-purple to-magenta mb-4"
            >
              <Sparkles className="w-8 h-8 text-background" />
            </motion.div>
            <h1 className="text-2xl font-bold gradient-text">ContaFlow IA</h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? "Entre na sua conta" : "Crie sua conta gratuita"}
            </p>
          </div>

          {/* Form */}
          <motion.div
            layout
            className="glass-strong rounded-2xl p-6 border border-primary/20"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="signup-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Nome Completo */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    {/* Nome Preferido */}
                    <div className="space-y-2">
                      <Label htmlFor="preferredName">
                        Como você gostaria de ser chamado?
                      </Label>
                      <div className="relative">
                        <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="preferredName"
                          type="text"
                          placeholder="Apelido ou nome social (opcional)"
                          value={preferredName}
                          onChange={(e) => setPreferredName(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se deixar em branco, usaremos seu primeiro nome
                      </p>
                    </div>

                    {/* Sexo */}
                    <div className="space-y-3">
                      <Label>Sexo *</Label>
                      <RadioGroup
                        value={gender}
                        onValueChange={setGender}
                        className="grid grid-cols-2 gap-2"
                      >
                        {genderOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      {errors.gender && (
                        <p className="text-sm text-destructive">{errors.gender}</p>
                      )}
                    </div>

                    {/* Data de Nascimento */}
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de nascimento *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="birthDate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="pl-10"
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      {errors.birthDate && (
                        <p className="text-sm text-destructive">{errors.birthDate}</p>
                      )}
                    </div>

                    {/* Estado e Cidade */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Estado *</Label>
                        <Select value={selectedState} onValueChange={handleStateChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {brazilianStates.map((state) => (
                              <SelectItem key={state.uf} value={state.uf}>
                                {state.uf} - {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && (
                          <p className="text-sm text-destructive">{errors.state}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Cidade *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                          <Input
                            type="text"
                            placeholder={stateCapital || "Cidade"}
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.city && (
                          <p className="text-sm text-destructive">{errors.city}</p>
                        )}
                      </div>
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(XX) XXXXX-XXXX"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="pl-10"
                          maxLength={15}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    <div className="border-t border-border/50 pt-4 mt-4" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email {!isLogin && "*"}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha {!isLogin && "*"}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan to-purple hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Entrar" : "Criar conta"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? (
                  <>
                    Não tem conta?{" "}
                    <span className="text-primary font-medium">Criar conta</span>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <span className="text-primary font-medium">Entrar</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* FIN Introduction */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <div className="glass rounded-xl p-4 inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
                <span className="text-sm font-bold text-background">FIN</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Oi! Sou o <span className="text-primary font-medium">FIN</span>, seu assistente financeiro. Vamos juntos conquistar sua liberdade financeira!
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
