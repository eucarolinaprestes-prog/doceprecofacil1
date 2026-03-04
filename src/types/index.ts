// ===== Auth =====
export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "staff";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// ===== Recipes =====
export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  category: string;
  yield_quantity: number;
  preparation_time: number; // minutes
  packaging_cost: number;
  extra_cost: number;
  ingredients: RecipeIngredient[];
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
}

// ===== Ingredients (Estoque) =====
export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  total_quantity: number;
  unit: string;
  total_cost: number;
  cost_per_unit: number;
  minimum_stock: number;
  expiration_date: string | null;
  created_at: string;
}

// ===== Clients =====
export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  whatsapp: string;
  address: string;
  created_at: string;
}

// ===== Orders =====
export type OrderStatus = "pending" | "paid" | "delivered" | "cancelled";
export type DeliveryType = "pickup" | "delivery";
export type PaymentMethod = "cash" | "pix" | "card" | "transfer";

export interface Order {
  id: string;
  user_id: string;
  client_id: string;
  client_name: string;
  recipe_id: string;
  recipe_name: string;
  quantity: number;
  delivery_date: string;
  delivery_time: string;
  delivery_type: DeliveryType;
  decoration_fee: number;
  delivery_fee: number;
  discount: number;
  custom_price: number | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  total_value: number;
  profit: number;
  created_at: string;
}

// ===== Financial =====
export type TransactionType = "income" | "expense";

export interface FinancialTransaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  date: string;
  related_order_id: string | null;
  created_at: string;
}

// ===== Goals =====
export interface Goal {
  id: string;
  user_id: string;
  month: number;
  year: number;
  target_revenue: number;
  current_revenue: number;
}

// ===== Dashboard =====
export interface DashboardData {
  monthly_revenue: number;
  monthly_profit: number;
  weekly_orders: number;
  goal_progress: number;
  goal_target: number;
  low_stock_alerts: { id: string; name: string; quantity: number; minimum: number; unit: string }[];
}
