import type { Tables, TablesInsert, TablesUpdate } from "./supabase";

// ── Row types (read from DB) ────────────────────────────────
export type User = Tables<"users">;
export type Product = Tables<"products">;
export type Transaction = Tables<"transactions">;
export type InventoryMovement = Tables<"inventory_movements">;
export type CashClose = Tables<"cash_closes">;
export type ExchangeRate = Tables<"exchange_rates">;
export type AppSettings = Tables<"app_settings">;
export type Return = Tables<"returns">;
export type ReturnItem = Tables<"return_items">;

// ── Insert types (write to DB — omits auto-generated fields) ─
export type ProductInsert = TablesInsert<"products">;
export type TransactionInsert = TablesInsert<"transactions">;
export type InventoryMovementInsert = TablesInsert<"inventory_movements">;
export type CashCloseInsert = TablesInsert<"cash_closes">;
export type ExchangeRateInsert = TablesInsert<"exchange_rates">;
export type ReturnInsert = TablesInsert<"returns">;
export type ReturnItemInsert = TablesInsert<"return_items">;

// ── Update types (partial write to DB) ──────────────────────
export type ProductUpdate = TablesUpdate<"products">;
export type TransactionUpdate = TablesUpdate<"transactions">;
export type InventoryMovementUpdate = TablesUpdate<"inventory_movements">;
export type ExchangeRateUpdate = TablesUpdate<"exchange_rates">;

// ── Extended types with joined relations ────────────────────
export type TransactionWithRelations = Transaction & {
  products: Pick<Product, "code" | "description">;
  users: Pick<User, "fullname">;
};

export type InventoryMovementWithRelations = InventoryMovement & {
  products: Pick<Product, "code" | "description">;
  users: Pick<User, "fullname">;
};

// ── Return types with joined relations ──────────────────────
export type ReturnItemWithProduct = ReturnItem & {
  products: Pick<Product, "code" | "description">;
};

export type ReturnTransactionWithProduct = Transaction & {
  products: Pick<Product, "code" | "description">;
};

export type ReturnWithRelations = Return & {
  users: Pick<User, "fullname">;
  return_items: ReturnItemWithProduct[];
  transactions: ReturnTransactionWithProduct[];
};

// ── Return RPC payload types ────────────────────────────────
export type ProcessReturnPayload = {
  p_type: "exchange" | "refund";
  p_returned_items: {
    product_id: string;
    quantity: number;
    price_usd: number;
    price_ves: number;
  }[];
  p_new_items?:
    | {
        product_id: string;
        quantity: number;
        price_usd: number;
        price_ves: number;
      }[]
    | null;
  p_exchange_rate: number;
  p_user_id: string;
  p_notes?: string;
};
