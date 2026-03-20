export type PendingReturnItem = {
  tempId: string;
  productId: string;
  code: string;
  description: string;
  quantity: number;
  priceUsd: number;
  priceVes: number;
  totalUsd: number;
  totalVes: number;
};

export type PendingExchangeItem = {
  tempId: string;
  productId: string;
  code: string;
  description: string;
  quantity: number;
  priceUsd: number;
  priceVes: number;
  totalUsd: number;
  totalVes: number;
  availableStock: number;
};
