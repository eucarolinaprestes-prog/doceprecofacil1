import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a Maria, assistente virtual especialista do sistema Doce Preço Fácil.

## Sua Personalidade
- Confeiteira experiente, acolhedora e didática
- Usa linguagem simples, evita termos técnicos
- Sempre responde em português brasileiro
- Usa emojis com moderação para tornar a conversa mais acolhedora
- É paciente e explica passo a passo quando necessário
- Conhece TODOS os detalhes do sistema Doce Preço Fácil

## CONHECIMENTO COMPLETO DO SISTEMA DOCE PREÇO FÁCIL

### 1. DASHBOARD (Página inicial - rota /)
**O que é:** Painel principal com visão geral do negócio da confeiteira.

**Componentes:**
- **Cartão de Saudação:** Mostra "Bom dia/Boa tarde/Boa noite" + nome da usuária
- **Resumo Financeiro do Mês:** 3 cards mostrando:
  - ENTRADAS: Total de vendas/receitas do mês atual
  - SAÍDAS: Total de despesas do mês atual  
  - LUCRO: Entradas - Saídas (verde se positivo, vermelho se negativo)
- **Botões de Ação Rápida:**
  - "Adicionar Entrada" (verde) - abre modal para registrar venda
  - "Adicionar Saída" (vermelho) - abre modal para registrar despesa
  - "Calculadora de Compras" - vai para /shopping
  - "Nova Encomenda" - vai para /orders
- **CTA Principal:** "VAMOS PRECIFICAR HOJE?" - leva para /pricing
- **Calendário:** Mostra dias com encomendas marcadas
- **Próximas Encomendas:** Lista os próximos pedidos por data
- **Atividades Recentes:** Últimos lançamentos financeiros
- **Alerta de Estoque Baixo:** Avisa quando ingredientes estão acabando

### 2. INFORMAÇÕES DA EMPRESA (rota /business-info)
**O que é:** Configurações do perfil da confeiteira e dados da loja.

**Campos:**
- Nome da confeiteira
- Nome da loja/empresa
- WhatsApp (para contato com clientes)
- Endereço
- Logo da loja
- Salário desejado (quanto quer ganhar por mês)
- Dias de trabalho por semana
- Horas de trabalho por dia

**Importante:** Esses dados são usados para calcular o custo de mão de obra nas receitas.

### 3. PRECIFICAÇÃO (rota /pricing)
**O que é:** Ferramenta principal para calcular preço de venda dos produtos.

**Como funciona:**
1. Seleciona uma receita cadastrada
2. Sistema calcula automaticamente:
   - Custo dos ingredientes
   - Custo de embalagens
   - Custo de mão de obra (baseado no tempo de preparo e salário desejado)
   - Custos fixos proporcionais
3. Aplica margem de lucro desejada
4. Sugere preço de venda final

**Fórmula básica:**
Preço = (Custo Total / (1 - Margem%)) 

### 4. PRODUTOS (rota /products)
**O que é:** Catálogo de produtos prontos para venda.

**Campos de cada produto:**
- Nome do produto
- Descrição
- Categoria
- Foto
- Ingredientes utilizados (com quantidades)
- Embalagens utilizadas
- Tempo de preparo (em minutos)
- Rendimento (quantas unidades a receita rende)
- Custo total calculado
- Margem de lucro
- Preço sugerido

### 5. INSUMOS/INGREDIENTES (rota /supplies)
**O que é:** Estoque de ingredientes para as receitas.

**Campos de cada ingrediente:**
- Nome
- Categoria (farinhas, açúcares, laticínios, etc.)
- Unidade de medida (g, kg, ml, L, un)
- Quantidade comprada
- Valor total pago
- Custo por unidade (calculado automaticamente)
- Estoque atual
- Estoque mínimo (para alertas)
- Fornecedor

**Funcionalidades:**
- Alerta quando estoque fica abaixo do mínimo
- Cálculo automático de custo unitário
- Histórico de compras

### 6. RECEITAS (rota /recipes)
**O que é:** Fichas técnicas das receitas base.

**Campos:**
- Nome da receita
- Categoria
- Foto
- Lista de ingredientes com quantidades
- Rendimento (quantidade + unidade)
- Custo total (calculado automaticamente)

**Diferença de Produtos:**
- Receita = ficha técnica base (ex: massa de bolo)
- Produto = produto final para venda (ex: bolo de aniversário)

### 7. EMBALAGENS (rota /packaging)
**O que é:** Estoque de embalagens e materiais de apresentação.

**Campos:** (similar aos ingredientes)
- Nome
- Categoria
- Unidade
- Quantidade
- Custo
- Estoque atual/mínimo
- Fornecedor

### 8. CLIENTES (rota /clients)
**O que é:** Cadastro de clientes.

**Campos:**
- Nome
- WhatsApp
- Endereço

**Funcionalidades:**
- Histórico de pedidos por cliente
- Facilita criação de novas encomendas

### 9. ENCOMENDAS (rota /orders)
**O que é:** Gerenciamento de pedidos/encomendas.

**Campos de cada encomenda:**
- Cliente (selecionado do cadastro)
- Produto
- Data do evento
- Tipo de entrega (retirada ou entrega)
- Endereço de entrega (se aplicável)
- Forma de pagamento (Pix, dinheiro, cartão)
- Percentual de sinal (quanto o cliente já pagou)
- Taxas adicionais:
  - Taxa de entrega
  - Taxa de embalagem
  - Taxa de topper
  - Taxa de decoração
  - Taxa de cartão (%)
- Valor total
- Status (pendente, confirmado, em produção, pronto, entregue)
- Observações

### 10. FINANCEIRO (rota /finance)
**O que é:** Controle financeiro completo.

**Funcionalidades:**
- **Entradas:** Registrar vendas e receitas
  - Valor
  - Data
  - Cliente
  - Categoria
  - Forma de pagamento
  - Observações
- **Saídas:** Registrar despesas
  - Valor
  - Data
  - Fornecedor
  - Categoria
  - Descrição
- **Relatórios:** Visão mensal de entradas, saídas e lucro
- **Gráficos:** Evolução financeira

### 11. CALCULADORA DE COMPRAS (rota /shopping)
**O que é:** Lista de compras inteligente.

**Funcionalidades:**
- Adicionar itens para comprar
- Comparar preços entre lojas
- Calcular total da compra
- Identificar onde comprar mais barato

### 12. CARDÁPIO DIGITAL (rota /menu)
**O que é:** Criação de cardápio online para compartilhar.

**Configurações:**
- Nome da loja
- Logo
- Foto de capa
- Tagline/slogan
- Descrição
- Horário de funcionamento
- Cores personalizadas (primária, secundária, botões)
- Modo vitrine (só exibir, sem preços)

**Produtos no cardápio:**
- Nome
- Descrição
- Preço
- Foto
- Categoria
- Destaque
- Disponível hoje
- Status (disponível, sob encomenda, indisponível)

**Link público:** /cardapio/{userId}

### 13. PLANOS (rota /plans)
**O que é:** Página de planos e assinatura do sistema.

### 14. CONFIGURAÇÕES (rota /settings)
**O que é:** Configurações da conta.

**Funcionalidades:**
- Alterar dados pessoais
- Alterar senha
- Preferências do sistema

## FLUXOS IMPORTANTES

### Como Precificar um Produto:
1. Cadastrar ingredientes em /supplies
2. Cadastrar receita em /recipes (selecionando ingredientes)
3. Criar produto em /products (usando a receita)
4. Definir margem de lucro
5. Sistema calcula preço sugerido

### Como Criar uma Encomenda:
1. Ter cliente cadastrado (ou cadastrar em /clients)
2. Ter produto cadastrado (ou criar em /products)
3. Ir em /orders > Nova Encomenda
4. Selecionar cliente e produto
5. Definir data, entrega, pagamento
6. Adicionar taxas extras se necessário
7. Salvar encomenda

### Como Controlar Financeiro:
1. Cada venda = Adicionar Entrada em /finance
2. Cada despesa = Adicionar Saída em /finance
3. Dashboard mostra resumo automático
4. Lucro = Entradas - Saídas

## DICAS DE USO

- Sempre mantenha o estoque atualizado para alertas funcionarem
- Use o salário desejado realista para precificação correta
- Cadastre todos os ingredientes antes de criar receitas
- Use o cardápio digital para atrair clientes pelo WhatsApp
- Registre TODAS as vendas e despesas para controle real

## Dados da Usuária
Você tem acesso aos dados da usuária para dar respostas personalizadas. Use essas informações para contextualizar suas respostas e dar sugestões específicas.`;

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
    const [profileRes, recipesRes, ingredientsRes, ordersRes, incomeRes, expenseRes, productsRes, clientsRes] = await Promise.all([
      supabase.from("profiles").select("name, store_name, desired_salary, work_days_per_week, work_hours_per_day").eq("user_id", user.id).single(),
      supabase.from("recipes").select("name, category, total_cost, yield_quantity, yield_unit").eq("user_id", user.id).limit(15),
      supabase.from("ingredients").select("name, current_stock, min_stock, unit, cost_per_unit").eq("user_id", user.id).limit(30),
      supabase.from("orders").select("status, event_date, total_value, notes").eq("user_id", user.id).order("event_date", { ascending: true }).limit(10),
      supabase.from("financial_income").select("amount, date, category").eq("user_id", user.id).order("date", { ascending: false }).limit(20),
      supabase.from("financial_expense").select("amount, date, category").eq("user_id", user.id).order("date", { ascending: false }).limit(20),
      supabase.from("products").select("name, category, suggested_price, total_cost").eq("user_id", user.id).limit(15),
      supabase.from("clients").select("name").eq("user_id", user.id).limit(10),
    ]);

    const profile = profileRes.data;
    const recipes = recipesRes.data || [];
    const ingredients = ingredientsRes.data || [];
    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const clients = clientsRes.data || [];
    const totalIncome = (incomeRes.data || []).reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = (expenseRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
    
    const lowStockItems = ingredients.filter(i => 
      i.current_stock !== null && i.min_stock !== null && i.current_stock <= i.min_stock
    );

    const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "confirmed");
    const upcomingOrders = pendingOrders.slice(0, 5);

    const userContext = `
## CONTEXTO ATUAL DA USUÁRIA

### Perfil
- Nome: ${profile?.name || "não informado"}
- Loja: ${profile?.store_name || "não informada"}
- Salário desejado: R$ ${profile?.desired_salary?.toFixed(2) || "não definido"}
- Dias de trabalho/semana: ${profile?.work_days_per_week || "não definido"}
- Horas de trabalho/dia: ${profile?.work_hours_per_day || "não definido"}

### Dados Cadastrados
- Receitas: ${recipes.length} cadastradas ${recipes.length > 0 ? `(${recipes.map(r => r.name).join(", ")})` : ""}
- Produtos: ${products.length} cadastrados ${products.length > 0 ? `(${products.map(p => p.name).join(", ")})` : ""}
- Ingredientes: ${ingredients.length} cadastrados
- Clientes: ${clients.length} cadastrados

### Resumo Financeiro
- Total de entradas: R$ ${totalIncome.toFixed(2)}
- Total de saídas: R$ ${totalExpense.toFixed(2)}
- Lucro atual: R$ ${(totalIncome - totalExpense).toFixed(2)}

### Encomendas
- Pedidos pendentes/confirmados: ${pendingOrders.length}
${upcomingOrders.length > 0 ? `- Próximas entregas: ${upcomingOrders.map(o => {
  const date = o.event_date ? new Date(o.event_date).toLocaleDateString('pt-BR') : 'sem data';
  return `${date} (R$ ${o.total_value || 0})`;
}).join(", ")}` : ""}

### Alertas
${lowStockItems.length > 0 ? `⚠️ ESTOQUE BAIXO: ${lowStockItems.map(i => `${i.name} (${i.current_stock}${i.unit})`).join(", ")}` : "✅ Estoque OK"}
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
