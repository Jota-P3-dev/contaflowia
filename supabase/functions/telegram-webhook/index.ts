import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TELEGRAM_API = "https://api.telegram.org/bot";

const FIN_TELEGRAM_PROMPT = `Você é o FIN, um assistente financeiro inteligente no Telegram.

## Sua Personalidade:
- Amigo sábio brasileiro que entende de finanças
- Fala de forma informal mas respeitosa
- Usa emojis com moderação (1-2 por mensagem)
- Empático e nunca julga

## Comandos Especiais:
Você pode detectar quando o usuário quer registrar uma despesa. Exemplos:
- "gastei 50 no mercado" → Registrar despesa de R$50 na categoria Mercado
- "paguei 100 de luz" → Registrar despesa de R$100 na categoria Contas
- "comprei café por 15" → Registrar despesa de R$15 na categoria Alimentação

Se detectar uma intenção de registro de despesa, responda confirmando o registro.

## Contexto Financeiro do Usuário:
{userContext}

## Formato:
- Respostas curtas (2-3 parágrafos máximo)
- Sempre termine com uma pergunta ou sugestão
- Lembre-se: você está no Telegram, seja direto!`;

// --- Short-term memory (RAM) ---
// Keeps last N messages per user (in-memory). Resets on cold start.
type ChatMsg = { role: "user" | "assistant"; content: string };
const MEMORY_MAX_MESSAGES = 6; // 4–6 is good. We'll use 6.
const conversationMemory = new Map<string, ChatMsg[]>();

function getMemory(userId: string): ChatMsg[] {
  return conversationMemory.get(userId) ?? [];
}

function pushMemory(userId: string, msg: ChatMsg) {
  const current = conversationMemory.get(userId) ?? [];
  current.push(msg);
  if (current.length > MEMORY_MAX_MESSAGES) {
    current.splice(0, current.length - MEMORY_MAX_MESSAGES);
  }
  conversationMemory.set(userId, current);
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  const response = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    }),
  });
  return response.json();
}

async function getUserContext(supabase: any, userId: string) {
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

  const totalIncome = incomes.reduce((sum: number, i: any) => sum + Number(i.amount), 0);
  const totalDebt = debts.reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
  const leisureRemaining = leisure ? Number(leisure.monthly_amount) - Number(leisure.spent_this_month || 0) : 0;

  return {
    userName: profile?.name || "Usuário",
    context: `
Nome: ${profile?.name || "Não informado"}
Renda mensal: R$ ${totalIncome.toFixed(2)}
Total de dívidas: R$ ${totalDebt.toFixed(2)}
Dívidas ativas: ${debts.length > 0 ? debts.map((d: any) => `${d.name} (R$ ${Number(d.remaining_amount).toFixed(2)})`).join(", ") : "Nenhuma"}
Metas ativas: ${goals.length > 0 ? goals.map((g: any) => `${g.name} (${((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(0)}%)`).join(", ") : "Nenhuma"}
Lazer disponível: R$ ${leisureRemaining.toFixed(2)}
    `.trim(),
  };
}

async function callFIN(userContext: string, history: ChatMsg[], message: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("Configuration error: OPENAI_API_KEY not set");
    return "Tô sem acesso à IA agora 😕 (configuração faltando). Tenta de novo em instantes!";
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
  const systemPrompt = FIN_TELEGRAM_PROMPT.replace("{userContext}", userContext);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI error:", await response.text());
    return "Desculpe, estou com dificuldades técnicas. Tente novamente em instantes! 🔧";
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "Desculpe, não consegui processar sua mensagem.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!TELEGRAM_BOT_TOKEN) {
      console.error("Configuration error: TELEGRAM_BOT_TOKEN not set");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const update = await req.json();

    console.log("Telegram update received:", JSON.stringify(update));

    // Handle only text messages
    const message = update.message;
    if (!message || !message.text) {
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const telegramChatId = chatId.toString();

    // Check if user is linked
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, name")
      .eq("telegram_chat_id", telegramChatId)
      .maybeSingle();

    // Handle /start command
    if (text === "/start") {
      const welcomeMessage = profile
        ? `👋 Olá, ${profile.name || "amigo"}! Sou o FIN, seu assistente financeiro.\n\nVocê já está conectado! Use:\n• /saldo - Ver resumo financeiro\n• /metas - Ver suas metas\n• Ou simplesmente me conte o que gastou!\n\nExemplo: "gastei 50 no mercado"`
        : `👋 Olá! Sou o FIN, seu assistente financeiro inteligente.\n\nPara usar todas as funcionalidades, você precisa vincular sua conta do ContaFlow IA.\n\n📱 Acesse o app e clique em "Conectar Telegram" para obter seu código de vinculação.\n\nDepois, envie:\n/vincular SEU_CODIGO`;

      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, welcomeMessage);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Handle /vincular command
    if (text.startsWith("/vincular ")) {
      const code = text.replace("/vincular ", "").trim().toUpperCase();

      if (!code || code.length < 6) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Código inválido. Use: /vincular SEU_CODIGO");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Find the link code
      const { data: linkCode } = await supabase
        .from("telegram_link_codes")
        .select("*")
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!linkCode) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Código inválido ou expirado. Gere um novo código no app!");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Link the account
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ telegram_chat_id: telegramChatId })
        .eq("user_id", linkCode.user_id);

      if (updateError) {
        console.error("Error linking account:", updateError);
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Erro ao vincular conta. Tente novamente!");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      // Mark code as used
      await supabase
        .from("telegram_link_codes")
        .update({ used: true })
        .eq("id", linkCode.id);

      // Get user name
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", linkCode.user_id)
        .maybeSingle();

      await sendTelegramMessage(
        TELEGRAM_BOT_TOKEN,
        chatId,
        `✅ Conta vinculada com sucesso, ${userProfile?.name || "amigo"}!\n\nAgora você pode:\n• Me contar seus gastos ("gastei 50 no mercado")\n• Ver seu /saldo\n• Acompanhar suas /metas\n• Conversar sobre finanças\n\n🚀 Vamos conquistar sua liberdade financeira juntos!`
      );

      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // From here, user needs to be linked
    if (!profile) {
      await sendTelegramMessage(
        TELEGRAM_BOT_TOKEN,
        chatId,
        "🔗 Você precisa vincular sua conta primeiro!\n\n1. Acesse o ContaFlow IA\n2. Clique em 'Conectar Telegram'\n3. Envie aqui: /vincular SEU_CODIGO"
      );
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const userId = profile.user_id;
    const { context } = await getUserContext(supabase, userId);

    // Handle /saldo command
    if (text === "/saldo") {
      const [incomesResult, debtsResult, leisureResult] = await Promise.all([
        supabase.from("income_sources").select("amount").eq("user_id", userId),
        supabase.from("debts").select("remaining_amount, monthly_payment").eq("user_id", userId).eq("is_paid", false),
        supabase.from("leisure_budget").select("*").eq("user_id", userId).maybeSingle(),
      ]);

      const totalIncome = (incomesResult.data || []).reduce((sum: number, i: any) => sum + Number(i.amount), 0);
      const totalDebt = (debtsResult.data || []).reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
      const monthlyDebtPayment = (debtsResult.data || []).reduce((sum: number, d: any) => sum + Number(d.monthly_payment || 0), 0);
      const leisure = leisureResult.data;
      const leisureRemaining = leisure ? Number(leisure.monthly_amount) - Number(leisure.spent_this_month || 0) : 0;

      const balanceMessage = `📊 *Seu Resumo Financeiro*\n\n💰 Renda mensal: R$ ${totalIncome.toFixed(2)}\n💳 Dívidas totais: R$ ${totalDebt.toFixed(2)}\n📅 Parcelas do mês: R$ ${monthlyDebtPayment.toFixed(2)}\n🎉 Lazer disponível: R$ ${leisureRemaining.toFixed(2)}\n\nQuer ver mais detalhes? Me pergunte!`;

      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, balanceMessage);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Handle /metas command
    if (text === "/metas") {
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .eq("is_achieved", false)
        .order("created_at", { ascending: false });

      if (!goals || goals.length === 0) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "🎯 Você ainda não tem metas cadastradas!\n\nAcesse o ContaFlow IA para criar suas primeiras metas financeiras.");
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      let goalsMessage = "🎯 *Suas Metas*\n\n";
      goals.forEach((goal: any) => {
        const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
        const progressBar = "█".repeat(Math.floor(progress / 10)) + "░".repeat(10 - Math.floor(progress / 10));
        goalsMessage += `*${goal.name}*\n${progressBar} ${progress.toFixed(0)}%\nR$ ${Number(goal.current_amount).toFixed(2)} / R$ ${Number(goal.target_amount).toFixed(2)}\n\n`;
      });

      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, goalsMessage);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Handle expense registration pattern
    const expensePatterns = [
      /(?:gastei|paguei|comprei)\s+(?:R\$\s*)?(\d+(?:[.,]\d{2})?)\s+(?:reais?\s+)?(?:no?|em|de|na?)\s+(.+)/i,
      /(\d+(?:[.,]\d{2})?)\s+(?:reais?\s+)?(?:no?|em|de|na?)\s+(.+)/i,
    ];

    for (const pattern of expensePatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(",", "."));
        let description = match[2].trim();

        if (isNaN(amount) || amount < 0.01 || amount > 1000000) {
          await sendTelegramMessage(
            TELEGRAM_BOT_TOKEN,
            chatId,
            "❌ Valor inválido. Use valores entre R$0,01 e R$1.000.000"
          );
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (description.length > 200) {
          description = description.substring(0, 200);
        }

        description = description.replace(/[<>\"'&]/g, "");

        if (!description || description.length < 1) {
          await sendTelegramMessage(
            TELEGRAM_BOT_TOKEN,
            chatId,
            "❌ Descrição inválida. Informe onde você gastou."
          );
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        const { error: insertError } = await supabase.from("transactions").insert({
          user_id: userId,
          amount: amount,
          description: description,
          type: "expense",
          date: new Date().toISOString().split("T")[0],
        });

        if (insertError) {
          console.error("Error inserting transaction:", insertError);
          await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "❌ Erro ao registrar despesa. Tente novamente!");
        } else {
          const { data: leisure } = await supabase
            .from("leisure_budget")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (leisure) {
            const newSpent = Number(leisure.spent_this_month || 0) + amount;
            await supabase
              .from("leisure_budget")
              .update({ spent_this_month: newSpent })
              .eq("id", leisure.id);

            const remaining = Number(leisure.monthly_amount) - newSpent;
            await sendTelegramMessage(
              TELEGRAM_BOT_TOKEN,
              chatId,
              `✅ Anotado! R$ ${amount.toFixed(2)} em "${description}"\n\n💰 Lazer restante: R$ ${remaining.toFixed(2)}\n\nQuer que eu analise esse gasto?`
            );
          } else {
            await sendTelegramMessage(
              TELEGRAM_BOT_TOKEN,
              chatId,
              `✅ Anotado! R$ ${amount.toFixed(2)} em "${description}"\n\nQuer que eu analise como está seu mês?`
            );
          }
        }

        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
    }

    // Default: Chat with FIN (OpenAI) + short-term memory
    const history = getMemory(userId);

    // save user's message into memory
    pushMemory(userId, { role: "user", content: text });

    const finResponse = await callFIN(context, history, text);

    // save assistant response into memory
    pushMemory(userId, { role: "assistant", content: finResponse });

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, finResponse);

    return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`Telegram webhook error [${errorId}]:`, error);
    return new Response(
      JSON.stringify({ error: "An error occurred", error_id: errorId }),
      { status: 500, headers: corsHeaders }
    );
  }
});
