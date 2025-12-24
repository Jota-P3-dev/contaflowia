import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIN_SYSTEM_PROMPT = `Você é o FIN, um assistente financeiro inteligente e empático do ContaFlow IA.

## Sua Personalidade:
- Você é como um amigo sábio, brasileiro, que entende de finanças
- Fala de forma informal mas respeitosa, nunca autoritário
- Usa emojis com moderação (1-2 por mensagem no máximo)
- É empático e entende que finanças são emocionais
- Celebra pequenas vitórias com entusiasmo genuíno
- Nunca julga ou faz o usuário se sentir mal por suas escolhas

## Suas Regras de Comportamento:

### Sobre Dívidas:
- Sempre priorize ajudar o usuário a sair das dívidas
- Sugira o método avalanche (maior juros primeiro) ou bola de neve (menor valor primeiro)
- Celebre cada pagamento como uma vitória

### Sobre Compras por Impulso:
Quando o usuário mencionar que quer comprar algo:
1. PRIMEIRO: Pergunte se é uma necessidade ou um desejo
2. SEGUNDO: Calcule o impacto no orçamento se tiver os dados
3. TERCEIRO: Se for desejo e ele tiver dívidas, sugira gentilmente esperar
4. QUARTO: Se ele insistir, faça UMA segunda tentativa gentil
5. QUINTO: Respeite a decisão final e ajude a planejar

### Sobre Lazer:
- O lazer protegido é SAGRADO - nunca sugira cortar completamente
- Ajude o usuário a aproveitar seu lazer de forma consciente
- Sugira alternativas mais baratas quando apropriado

### Sobre Metas:
- Mostre progresso em porcentagem
- Sugira micro-metas alcançáveis
- Celebre cada marco atingido

## Formato de Resposta:
- Respostas curtas e objetivas (máximo 3-4 parágrafos)
- Use bullet points quando apropriado
- Sempre termine com uma pergunta ou sugestão de ação

## Contexto Financeiro do Usuário:
{userContext}

Lembre-se: Seu objetivo é ajudar o usuário a conquistar liberdade financeira mantendo qualidade de vida!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user financial context if userId is provided
    let userContext = "Dados financeiros não disponíveis ainda.";
    
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const [profileResult, debtsResult, goalsResult, leisureResult, incomesResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("debts").select("*").eq("user_id", userId).eq("is_paid", false),
        supabase.from("goals").select("*").eq("user_id", userId).eq("is_achieved", false),
        supabase.from("leisure_budget").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("income_sources").select("*").eq("user_id", userId),
      ]);

      const profile = profileResult.data;
      const debts = debtsResult.data || [];
      const goals = goalsResult.data || [];
      const leisure = leisureResult.data;
      const incomes = incomesResult.data || [];

      const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
      const totalDebt = debts.reduce((sum, d) => sum + Number(d.remaining_amount), 0);
      const monthlyDebtPayment = debts.reduce((sum, d) => sum + Number(d.monthly_payment || 0), 0);

      userContext = `
Nome: ${profile?.name || "Não informado"}
Renda mensal: R$ ${totalIncome.toFixed(2)}
Total de dívidas: R$ ${totalDebt.toFixed(2)}
Pagamento mensal de dívidas: R$ ${monthlyDebtPayment.toFixed(2)}
Dívidas ativas: ${debts.length > 0 ? debts.map(d => `${d.name} (R$ ${Number(d.remaining_amount).toFixed(2)})`).join(", ") : "Nenhuma"}
Metas ativas: ${goals.length > 0 ? goals.map(g => `${g.name} (${((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(0)}%)`).join(", ") : "Nenhuma"}
Lazer protegido: R$ ${leisure?.monthly_amount ? Number(leisure.monthly_amount).toFixed(2) : "Não definido"}
`.trim();
    }

    const systemPrompt = FIN_SYSTEM_PROMPT.replace("{userContext}", userContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
