

# Doce Preco Facil — Rebuild Completo

## Resumo
Reconstruir todo o frontend do zero com nova estrutura de modulos, logo personalizada, Supabase como backend (auth + banco), e todas as telas iniciando vazias com empty states explicativos.

## Logo
Copiar a imagem enviada (`WhatsApp-Image-2026-02-15-at-22.11.17-removebg-preview.png`) para `src/assets/logo.png` e usar como logo principal no login, header e sidebar.

## Supabase
Conectar Supabase para auth (email/senha) e banco de dados. Criar tabelas com RLS (user_id = auth.uid()).

### Tabelas necessarias
- `profiles` (id, user_id, name, store_name, logo_url, whatsapp, address, desired_salary, work_days_per_week, work_hours_per_day, created_at)
- `fixed_costs` (id, user_id, category, amount)
- `variable_costs` (id, user_id, category, amount)
- `ingredients` (id, user_id, name, category, unit, total_cost, quantity_purchased, supplier, cost_per_unit)
- `packaging` (id, user_id, name, category, unit, total_cost, quantity_purchased, supplier, cost_per_unit)
- `products` (id, user_id, name, description, category, photo_url, yield_quantity, yield_unit, preparation_time, total_cost, suggested_price, profit_margin, ingredients_json, packaging_json)
- `clients` (id, user_id, name, whatsapp, address)
- `orders` (id, user_id, client_id, product_id, category, size, filling, topping, dough, event_date, delivery_type, payment_percent, payment_method, status, total_value, notes)
- `financial_income` (id, user_id, amount, category, date, payment_method, client_name, notes)
- `financial_expense` (id, user_id, amount, category, date, supplier, description)
- `shopping_list` (id, user_id, ingredient_name, quantity, unit_price, total)
- `menu_settings` (id, user_id, cover_photo_url, logo_url, description, business_hours)
- `menu_categories` (id, user_id, name, sort_order)

## Navegacao

### Menu lateral (desktop) / Hamburger (mobile)
Dashboard, Precos, Encomendas, Clientes, Insumos e Embalagens, Financas, Calculadora de compras, Cardapio digital, Informacoes, Planos, Configuracoes

### Menu inferior fixo (mobile)
Dashboard, Produtos, Encomendas, Financas, Planos (icone coroa)

## Paginas a criar/reescrever

### 1. Login/Cadastro
Tela unica com dois estados (tabs). Logo no topo. Campos conforme spec. Auth via Supabase.

### 2. Dashboard
- Saudacao "Oi, [nome]"
- Semana atual com dias destacados
- Card "Vamos precificar?" com botao
- 3 graficos (Entrada, Saida, Lucro) usando recharts
- Acoes rapidas (4 botoes)
- Atividades recentes
- Tudo vazio inicialmente com empty states

### 3. Precificacao (fluxo 5 etapas)
Wizard com stepper: Produto → Ingredientes/Embalagens → Mao de obra/Custos fixos → Estrategia de preco → Resultado. Usa dados de "Informacoes" para calcular mao de obra e custos fixos automaticamente.

### 4. Produtos
Lista de produtos precificados. Cards com custo/lucro/preco. Acoes: editar, duplicar, excluir.

### 5. Encomendas
Abas: Pendentes, Em producao, Entregues. Formulario com campos de personalizacao (tamanho, massa, recheio, cobertura). Botao "Enviar pelo WhatsApp" com mensagens pre-formatadas.

### 6. Clientes
CRUD simples: nome, WhatsApp, endereco.

### 7. Insumos e Embalagens
Dois tabs: Ingredientes / Embalagens. CRUD com calculo de custo unitario.

### 8. Financas
Graficos entrada/saida. Tabs para registrar entradas e saidas com categorias especificas.

### 9. Calculadora de Compras
Lista de itens com ingrediente, quantidade, valor. Calculo de total automatico.

### 10. Cardapio Digital
Config: foto capa, logo, descricao, horario. Categorias editaveis. Produtos com visibilidade toggle. Botao compartilhar via WhatsApp.

### 11. Informacoes do Negocio
Nome da loja, logo, WhatsApp, endereco. Salario desejado + dias/horas trabalhados → calculo automatico do valor/hora. Custos fixos e variaveis (alimentam a precificacao).

### 12. Planos
3 planos: Prata (R$9,90/sem), Ouro (R$27/mes), Diamante (R$97/ano). Icone coroa no menu.

### 13. Configuracoes
Conta (senha, imagem, email), Assinatura, Notificacoes.

## Implementacao

Sera feito em fases dentro desta implementacao:
1. Setup Supabase (auth + tabelas + RLS) + Logo + Design system (manter paleta atual)
2. Layout (sidebar, bottom nav, header) + Login/Cadastro
3. Dashboard + Informacoes do Negocio
4. Precificacao (wizard 5 etapas) + Produtos
5. Insumos e Embalagens + Clientes
6. Encomendas (com WhatsApp)
7. Financas + Calculadora de Compras
8. Cardapio Digital + Planos + Configuracoes

Todas as telas iniciam vazias com empty states didaticos. Nenhum dado mock pre-preenchido.

