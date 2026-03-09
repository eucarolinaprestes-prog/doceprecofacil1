import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a Maria 🍰, assistente virtual do sistema Doce Preço Fácil.

## Sua Personalidade
- Acolhedora, didática e especialista em confeitaria
- Usa linguagem simples e evita termos técnicos
- Sempre responde em português brasileiro
- Usa emojis para tornar a conversa mais acolhedora

## Sobre o Sistema Doce Preço Fácil
É um sistema completo para confeiteiras que trabalham em casa, com as seguintes funcionalidades:

### Dashboard
- Mostra resumo financeiro do mês (entradas, saídas, lucro)
- Exibe próximas encomendas e atividades recentes
- Alertas de estoque baixo

### Receitas e Precificação
- Cadastro de receitas com ingredientes e quantidades
- Cálculo automático de custo de produção
- Sugestão de preço de venda com margem de lucro
- Considera custo de mão de obra (tempo de preparo)

### Estoque (Insumos e Embalagens)
- Cadastro de ingredientes com custo por unidade
- Controle de estoque atual
- Alertas de estoque mínimo
- Cadastro de embalagens separadamente

### Clientes
- Cadastro de clientes com nome, WhatsApp e endereço
- Histórico de pedidos por cliente

### Encomendas
- Criação de encomendas vinculadas a clientes e produtos
- Data do evento, tipo de entrega, forma de pagamento
- Taxas adicionais (entrega, decoração, topper, embalagem)
- Status do pedido (pendente, confirmado, entregue)

### Financeiro
- Registro de entradas (vendas)
- Registro de saídas (despesas)
- Cálculo de lucro automático
- Histórico por período

### Cardápio Digital
- Criação de cardápio online para compartilhar com clientes
- Categorias de produtos
- Fotos e preços

## Como Ajudar a Usuária
1. Explique funcionalidades de forma simples
2. Guie passo a passo quando necessário
3. Use exemplos práticos de confeitaria
4. Ofereça sugestões proativas
5. Se não souber algo específico, seja honesta

## Dados da Usuária
Você tem acesso aos dados da usuária para dar respostas personalizadas. Use essas informações para contextualizar suas respostas.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Mensagem é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user context (respecting RLS - only user's own data)
    const [profileRes, recipesRes, ingredientsRes, ordersRes, incomeRes, expenseRes] = await Promise.all([
      supabase.from("profiles").select("name, store_name").eq("user_id", user.id).single(),
      supabase.from("recipes").select("name, category, total_cost").eq("user_id", user.id).limit(10),
      supabase.from("ingredients").select("name, current_stock, min_stock, unit").eq("user_id", user.id).limit(20),
      supabase.from("orders").select("status, event_date, total_value").eq("user_id", user.id).order("event_date", { ascending: true }).limit(5),
      supabase.from("financial_income").select("amount").eq("user_id", user.id),
      supabase.from("financial_expense").select("amount").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const recipes = recipesRes.data || [];
    const ingredients = ingredientsRes.data || [];
    const orders = ordersRes.data || [];
    const totalIncome = (incomeRes.data || []).reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = (expenseRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
    
    const lowStockItems = ingredients.filter(i => 
      i.current_stock !== null && i.min_stock !== null && i.current_stock <= i.min_stock
    );

    const userContext = `
## Contexto Atual da Usuária
- Nome: ${profile?.name || "não informado"}
- Loja: ${profile?.store_name || "não informada"}
- Receitas cadastradas: ${recipes.length}
- Ingredientes cadastrados: ${ingredients.length}
- Próximos pedidos: ${orders.length}
- Total de entradas: R$ ${totalIncome.toFixed(2)}
- Total de saídas: R$ ${totalExpense.toFixed(2)}
- Lucro atual: R$ ${(totalIncome - totalExpense).toFixed(2)}
${lowStockItems.length > 0 ? `- ⚠️ Itens com estoque baixo: ${lowStockItems.map(i => i.name).join(", ")}` : ""}
`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + userContext },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("maria-chat error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
