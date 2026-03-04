

# Doce Preço Fácil — Frontend MVP

## Visão Geral
App web mobile-first para confeiteiras, com visual feminino elegante (rosa suave + dourado). Frontend completo com todos os 8 módulos, preparado para integrar com backend NestJS via API REST.

> **Nota:** O Lovable criará apenas o frontend. O backend NestJS + PostgreSQL deverá ser desenvolvido separadamente.

---

## Design System
- **Paleta:** Rosa suave (#FDE2E4, #FAD2CF), rose gold (#B76E79), dourado suave (#D4A574), branco e cinza claro
- **Tipografia:** Clean e legível, fontes arredondadas
- **Botões grandes**, cantos arredondados, ícones amigáveis
- **Mobile-first** com layout responsivo

---

## Navegação
- **Barra inferior fixa** (mobile) com ícones: Dashboard, Receitas, Estoque, Encomendas, Clientes
- **Menu lateral** (desktop) com acesso a Financeiro e Metas
- **Header** com logo, nome da usuária e botão de logout

---

## Módulos

### 1. Autenticação
- Tela de Login (email + senha)
- Tela de Cadastro
- Recuperação de senha
- Proteção de rotas (redireciona se não autenticado)
- Serviço de auth preparado para conectar com API JWT

### 2. Dashboard
- Cards visuais: Faturamento do mês, Lucro, Encomendas da semana
- Barra de progresso da meta mensal
- Lista de alertas de estoque baixo
- Dados mockados inicialmente

### 3. Receitas (CRUD)
- Lista de receitas com busca e filtro por categoria
- Formulário de criar/editar receita com campos: nome, categoria, rendimento, tempo de preparo, custo embalagem, custo extra
- Seção de ingredientes da receita (adicionar/remover da lista)
- Cálculos automáticos exibidos: custo total, custo unitário, preço sugerido, lucro estimado

### 4. Estoque / Ingredientes (CRUD)
- Lista de ingredientes com indicador visual de estoque baixo
- Formulário: nome, quantidade, unidade, custo total, custo unitário (calculado), estoque mínimo, validade
- Badge de alerta quando quantidade ≤ estoque mínimo

### 5. Clientes (CRUD)
- Lista simples com busca
- Formulário: nome, telefone, WhatsApp, endereço
- Botão de contato via WhatsApp

### 6. Encomendas (CRUD)
- Lista com filtros por status (pendente, pago, entregue, cancelado)
- Formulário: cliente, receita, quantidade, data/hora entrega, tipo (retirada/entrega)
- Campos adicionais: taxa decoração, taxa entrega, desconto, preço customizado, método pagamento
- Cálculo automático de valor total e lucro
- Mudança de status com confirmação

### 7. Financeiro
- Lista de transações (receitas/despesas)
- Filtros por período e categoria
- Resumo: total receitas, total despesas, saldo
- Formulário para adicionar transação manual

### 8. Metas
- Definir meta mensal de faturamento
- Visualização com barra de progresso e percentual atingido

---

## Estrutura Técnica
- Serviço de API centralizado (axios) pronto para apontar para o backend NestJS
- TypeScript interfaces para todos os modelos de dados
- React Query para gerenciamento de estado/cache das chamadas API
- Dados mockados para demonstração inicial
- Validação de formulários com Zod + React Hook Form
- Estados de loading, empty states e tratamento de erros

