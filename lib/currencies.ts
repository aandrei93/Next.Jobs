export const CURRENCY_CODES = ["EUR", "USD", "RON"] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];
