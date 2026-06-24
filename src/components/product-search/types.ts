export type ProductSearchResult = {
  id: string;
  code: string;
  description: string;
  price_usd: number;
  stock: number;
};

export type ProductSearchOptions = {
  requireStock?: boolean;
  showPrice?: boolean;
  autoFocus?: boolean;
  /** When false (default), selecting an inactive product shows a warning and is blocked. */
  allowInactive?: boolean;
};
