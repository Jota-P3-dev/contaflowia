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
import { Mail, Lock, User, ArrowRight, Loader2, Calendar, Phone, MapPin, Heart } from "lucide-react";
import { z } from "zod";
import { brazilianStates, genderOptions } from "@/data/brazilianStates";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";

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

  const stateCapital = useMemo(() => {
    const state = brazilianStates.find(s => s.uf === selectedState);
    return state?.capital || "";
  }, [selectedState]);

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

      {/* Animated Background */}
      <AnimatedBackground />

      <div className="relative min-h-screen flex items-center justify-center p-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="relative h-32 bg-gradient-to-br from-[hsl(280,50%,45%)] via-[hsl(300,45%,50%)] to-[hsl(320,50%,55%)] flex items-center justify-center overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-4 left-8 w-2 h-2 bg-white rounded-full animate-pulse" />
                <div className="absolute top-8 right-12 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-300" />
                <div className="absolute bottom-6 left-16 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
                <div className="absolute top-12 left-1/2 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-700" />
              </div>
              
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  {isLogin ? "Login" : "Criar Conta"}
                </h1>
                <p className="text-white/80 text-sm mt-1">ContaFlow IA</p>
              </motion.div>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8">
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
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-gray-600 text-sm">Nome completo *</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)]" />
                          <Input
                            id="name"
                            type="text"
                            placeholder="Seu nome completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700 placeholder:text-gray-400"
                          />
                        </div>
                        {errors.name && (
                          <p className="text-sm text-red-500 pl-4">{errors.name}</p>
                        )}
                      </div>

                      {/* Nome Preferido */}
                      <div className="space-y-1.5">
                        <Label htmlFor="preferredName" className="text-gray-600 text-sm">
                          Como gostaria de ser chamado?
                        </Label>
                        <div className="relative">
                          <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)]" />
                          <Input
                            id="preferredName"
                            type="text"
                            placeholder="Apelido (opcional)"
                            value={preferredName}
                            onChange={(e) => setPreferredName(e.target.value)}
                            className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      {/* Sexo */}
                      <div className="space-y-2">
                        <Label className="text-gray-600 text-sm">Sexo *</Label>
                        <RadioGroup
                          value={gender}
                          onValueChange={setGender}
                          className="grid grid-cols-2 gap-2"
                        >
                          {genderOptions.map((option) => (
                            <div 
                              key={option.value} 
                              className="flex items-center space-x-2 bg-[hsl(320,30%,97%)] rounded-full px-4 py-2 border border-[hsl(320,30%,85%)]"
                            >
                              <RadioGroupItem 
                                value={option.value} 
                                id={option.value}
                                className="border-[hsl(320,40%,60%)] text-[hsl(320,50%,50%)]"
                              />
                              <Label 
                                htmlFor={option.value} 
                                className="text-sm font-normal cursor-pointer text-gray-600"
                              >
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        {errors.gender && (
                          <p className="text-sm text-red-500 pl-4">{errors.gender}</p>
                        )}
                      </div>

                      {/* Data de Nascimento */}
                      <div className="space-y-1.5">
                        <Label htmlFor="birthDate" className="text-gray-600 text-sm">Data de nascimento *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)]" />
                          <Input
                            id="birthDate"
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700"
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        {errors.birthDate && (
                          <p className="text-sm text-red-500 pl-4">{errors.birthDate}</p>
                        )}
                      </div>

                      {/* Estado e Cidade */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-gray-600 text-sm">Estado *</Label>
                          <Select value={selectedState} onValueChange={handleStateChange}>
                            <SelectTrigger className="h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:ring-[hsl(320,50%,60%)] text-gray-700">
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[hsl(320,30%,85%)] shadow-lg z-50">
                              {brazilianStates.map((state) => (
                                <SelectItem key={state.uf} value={state.uf} className="text-gray-700 hover:bg-[hsl(320,30%,95%)] focus:bg-[hsl(320,50%,60%)] focus:text-white cursor-pointer">
                                  {state.uf} - {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.state && (
                            <p className="text-sm text-red-500 pl-4">{errors.state}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-gray-600 text-sm">Cidade *</Label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)] z-10" />
                            <Input
                              type="text"
                              placeholder={stateCapital || "Cidade"}
                              value={selectedCity}
                              onChange={(e) => setSelectedCity(e.target.value)}
                              className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700 placeholder:text-gray-400"
                            />
                          </div>
                          {errors.city && (
                            <p className="text-sm text-red-500 pl-4">{errors.city}</p>
                          )}
                        </div>
                      </div>

                      {/* Telefone */}
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-gray-600 text-sm">Telefone *</Label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)]" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="(XX) XXXXX-XXXX"
                            value={phone}
                            onChange={handlePhoneChange}
                            className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700 placeholder:text-gray-400"
                            maxLength={15}
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-sm text-red-500 pl-4">{errors.phone}</p>
                        )}
                      </div>

                      <div className="border-t border-[hsl(320,30%,90%)] pt-4 mt-4" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-600 text-sm">Email {!isLogin && "*"}</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)]" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 pl-4">{errors.email}</p>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-600 text-sm">Senha {!isLogin && "*"}</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(320,40%,60%)]" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 rounded-full border-[hsl(320,30%,85%)] bg-[hsl(320,30%,97%)] focus:border-[hsl(320,50%,60%)] focus:ring-[hsl(320,50%,60%)] text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 pl-4">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-[hsl(280,50%,50%)] via-[hsl(300,45%,55%)] to-[hsl(320,50%,55%)] hover:opacity-90 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-300"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Entrar" : "Criar conta"}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {isLogin ? (
                    <>
                      Não tem conta?{" "}
                      <span className="text-[hsl(300,50%,45%)] font-semibold">Criar conta</span>
                    </>
                  ) : (
                    <>
                      Já tem conta?{" "}
                      <span className="text-[hsl(300,50%,45%)] font-semibold">Entrar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* FIN Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 inline-flex items-center gap-3 border border-white/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(280,50%,50%)] to-[hsl(320,50%,55%)] flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">FIN</span>
              </div>
              <p className="text-sm text-white/90">
                Oi! Sou o <span className="font-semibold">FIN</span>, seu assistente financeiro.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
