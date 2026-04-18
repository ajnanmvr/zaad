export const PAYMENT_TEMPLATE_ICON_KEYS = [
  "card",
  "bank",
  "money",
  "cash",
  "pos",
  "wallet",
  "transfer",
  "receipt",
  "invoice",
  "mobile",
  "secure",
] as const;

export type TPaymentTemplateIcon = (typeof PAYMENT_TEMPLATE_ICON_KEYS)[number];

export const DEFAULT_PAYMENT_TEMPLATE_ICON: TPaymentTemplateIcon = "card";
