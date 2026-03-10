

# Plano: Página de Exportação de Dados CSV

## Resumo

Criar uma nova página "Exportar Dados" acessível pelo menu lateral (sidebar), onde o usuário pode exportar em CSV todos os dados das tabelas do banco de dados vinculadas ao seu negócio.

## O que será feito

1. **Nova rota `/export`** — Página com cards para cada categoria de dados exportável
2. **Novo item no sidebar** — Ícone `Download` com label "Exportar Dados", posicionado antes de "Planos"
3. **Página `ExportData.tsx`** — Interface com botões para exportar cada tabela em CSV

## Tabelas disponíveis para exportação

Cada botão exporta os dados do `business_id` do usuário logado:

| Botão | Tabela | Descrição |
|-------|--------|-----------|
| Produtos | `products` | Todos os produtos |
| Receitas | `recipes` | Todas as receitas |
| Insumos | `ingredients` | Ingredientes cadastrados |
| Embalagens | `packaging` | Embalagens cadastradas |
| Clientes | `clients` | Cadastro de clientes |
| Encomendas | `orders` | Pedidos/encomendas |
| Receitas Financeiras | `financial_income` | Entradas financeiras |
| Despesas | `financial_expense` | Saídas financeiras |
| Custos Fixos | `fixed_costs` | Custos fixos |
| Custos Variáveis | `variable_costs` | Custos variáveis |
| Lista de Compras | `shopping_list` | Itens da lista de compras |
| Assinaturas | `assinaturas` | Dados da assinatura |
| Cardápio - Produtos | `menu_products` | Produtos do cardápio |
| Cardápio - Categorias | `menu_categories` | Categorias do cardápio |
| Logs de Auditoria | `audit_logs` | Registro de ações |

## Lógica de exportação

- Consulta a tabela via Supabase client (respeitando RLS)
- Converte os dados em formato CSV (headers + rows)
- Dispara download automático do arquivo `.csv` no navegador
- Botão "Exportar Tudo" gera um ZIP ou exporta cada tabela individualmente em sequência

## Arquivos modificados

- `src/pages/ExportData.tsx` — Nova página
- `src/components/layout/AppLayout.tsx` — Adicionar item "Exportar Dados" no sidebar
- `src/App.tsx` — Adicionar rota `/export`

## Design

Mantém o padrão visual existente (cards, botões, cores). Sem alterações de layout ou estilo global.

