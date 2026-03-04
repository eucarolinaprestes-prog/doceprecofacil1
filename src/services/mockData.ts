import type { Recipe, Ingredient, Client, Order, FinancialTransaction, Goal, DashboardData } from "@/types";

export const mockIngredients: Ingredient[] = [
  { id: "1", user_id: "u1", name: "Farinha de Trigo", total_quantity: 5, unit: "kg", total_cost: 25, cost_per_unit: 5, minimum_stock: 2, expiration_date: "2026-06-01", created_at: "2026-01-01" },
  { id: "2", user_id: "u1", name: "Açúcar", total_quantity: 3, unit: "kg", total_cost: 15, cost_per_unit: 5, minimum_stock: 2, expiration_date: "2026-12-01", created_at: "2026-01-01" },
  { id: "3", user_id: "u1", name: "Ovos", total_quantity: 12, unit: "un", total_cost: 18, cost_per_unit: 1.5, minimum_stock: 6, expiration_date: "2026-03-20", created_at: "2026-01-01" },
  { id: "4", user_id: "u1", name: "Manteiga", total_quantity: 1, unit: "kg", total_cost: 22, cost_per_unit: 22, minimum_stock: 0.5, expiration_date: "2026-04-15", created_at: "2026-01-01" },
  { id: "5", user_id: "u1", name: "Leite Condensado", total_quantity: 2, unit: "un", total_cost: 16, cost_per_unit: 8, minimum_stock: 3, expiration_date: "2026-08-01", created_at: "2026-01-01" },
  { id: "6", user_id: "u1", name: "Chocolate em Pó", total_quantity: 0.3, unit: "kg", total_cost: 12, cost_per_unit: 40, minimum_stock: 0.5, expiration_date: "2026-09-01", created_at: "2026-01-01" },
];

export const mockRecipes: Recipe[] = [
  {
    id: "1", user_id: "u1", name: "Bolo de Chocolate", category: "Bolos", yield_quantity: 12, preparation_time: 60, packaging_cost: 5, extra_cost: 2,
    ingredients: [
      { id: "ri1", ingredient_id: "1", ingredient_name: "Farinha de Trigo", quantity: 0.5, unit: "kg", cost_per_unit: 5 },
      { id: "ri2", ingredient_id: "2", ingredient_name: "Açúcar", quantity: 0.3, unit: "kg", cost_per_unit: 5 },
      { id: "ri3", ingredient_id: "3", ingredient_name: "Ovos", quantity: 4, unit: "un", cost_per_unit: 1.5 },
      { id: "ri4", ingredient_id: "6", ingredient_name: "Chocolate em Pó", quantity: 0.1, unit: "kg", cost_per_unit: 40 },
    ],
    created_at: "2026-01-15", updated_at: "2026-01-15",
  },
  {
    id: "2", user_id: "u1", name: "Brigadeiro Gourmet", category: "Docinhos", yield_quantity: 50, preparation_time: 30, packaging_cost: 10, extra_cost: 0,
    ingredients: [
      { id: "ri5", ingredient_id: "5", ingredient_name: "Leite Condensado", quantity: 2, unit: "un", cost_per_unit: 8 },
      { id: "ri6", ingredient_id: "6", ingredient_name: "Chocolate em Pó", quantity: 0.1, unit: "kg", cost_per_unit: 40 },
      { id: "ri7", ingredient_id: "4", ingredient_name: "Manteiga", quantity: 0.05, unit: "kg", cost_per_unit: 22 },
    ],
    created_at: "2026-01-20", updated_at: "2026-01-20",
  },
];

export const mockClients: Client[] = [
  { id: "1", user_id: "u1", name: "Maria Silva", phone: "(11) 98765-4321", whatsapp: "5511987654321", address: "Rua das Flores, 123", created_at: "2026-01-01" },
  { id: "2", user_id: "u1", name: "Ana Oliveira", phone: "(11) 91234-5678", whatsapp: "5511912345678", address: "Av. Paulista, 456", created_at: "2026-01-05" },
  { id: "3", user_id: "u1", name: "Juliana Santos", phone: "(11) 99876-5432", whatsapp: "5511998765432", address: "Rua do Comércio, 789", created_at: "2026-02-01" },
];

export const mockOrders: Order[] = [
  { id: "1", user_id: "u1", client_id: "1", client_name: "Maria Silva", recipe_id: "1", recipe_name: "Bolo de Chocolate", quantity: 1, delivery_date: "2026-03-08", delivery_time: "14:00", delivery_type: "delivery", decoration_fee: 20, delivery_fee: 15, discount: 0, custom_price: null, payment_method: "pix", status: "paid", total_value: 150, profit: 95, created_at: "2026-03-01" },
  { id: "2", user_id: "u1", client_id: "2", client_name: "Ana Oliveira", recipe_id: "2", recipe_name: "Brigadeiro Gourmet", quantity: 100, delivery_date: "2026-03-10", delivery_time: "10:00", delivery_type: "pickup", decoration_fee: 0, delivery_fee: 0, discount: 10, custom_price: null, payment_method: "card", status: "pending", total_value: 240, profit: 180, created_at: "2026-03-02" },
  { id: "3", user_id: "u1", client_id: "3", client_name: "Juliana Santos", recipe_id: "1", recipe_name: "Bolo de Chocolate", quantity: 2, delivery_date: "2026-03-05", delivery_time: "16:00", delivery_type: "delivery", decoration_fee: 40, delivery_fee: 20, discount: 0, custom_price: null, payment_method: "cash", status: "delivered", total_value: 320, profit: 220, created_at: "2026-02-28" },
];

export const mockTransactions: FinancialTransaction[] = [
  { id: "1", user_id: "u1", type: "income", category: "Encomendas", description: "Bolo de Chocolate - Maria Silva", amount: 150, date: "2026-03-01", related_order_id: "1", created_at: "2026-03-01" },
  { id: "2", user_id: "u1", type: "expense", category: "Ingredientes", description: "Compra de farinha e açúcar", amount: 40, date: "2026-03-02", related_order_id: null, created_at: "2026-03-02" },
  { id: "3", user_id: "u1", type: "income", category: "Encomendas", description: "Bolo de Chocolate - Juliana Santos", amount: 320, date: "2026-02-28", related_order_id: "3", created_at: "2026-02-28" },
  { id: "4", user_id: "u1", type: "expense", category: "Embalagens", description: "Caixas e fitas", amount: 65, date: "2026-02-25", related_order_id: null, created_at: "2026-02-25" },
];

export const mockGoal: Goal = {
  id: "1", user_id: "u1", month: 3, year: 2026, target_revenue: 2000, current_revenue: 710,
};

export const mockDashboard: DashboardData = {
  monthly_revenue: 710,
  monthly_profit: 495,
  weekly_orders: 2,
  goal_progress: 35.5,
  goal_target: 2000,
  low_stock_alerts: [
    { id: "5", name: "Leite Condensado", quantity: 2, minimum: 3, unit: "un" },
    { id: "6", name: "Chocolate em Pó", quantity: 0.3, minimum: 0.5, unit: "kg" },
  ],
};
