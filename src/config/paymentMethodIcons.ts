import type { IconType } from "react-icons";
import { BsBank2, BsCashCoin } from "react-icons/bs";
import {
  FiClipboard,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import { GiCardPlay } from "react-icons/gi";
import { LuWallet } from "react-icons/lu";
import { TPaymentTemplateIcon } from "@/config/templateVisuals";

export type TPaymentMethodIconOption = {
  value: TPaymentTemplateIcon;
  label: string;
  Icon: IconType;
};

export const PAYMENT_METHOD_ICON_OPTIONS: TPaymentMethodIconOption[] = [
  { value: "card", label: "Card", Icon: FiCreditCard },
  { value: "bank", label: "Bank", Icon: BsBank2 },
  { value: "money", label: "Money", Icon: FiDollarSign },
  { value: "cash", label: "Cash", Icon: BsCashCoin },
  { value: "pos", label: "POS", Icon: GiCardPlay },
  { value: "wallet", label: "Wallet", Icon: LuWallet },
  { value: "transfer", label: "Transfer", Icon: FiRefreshCw },
  { value: "receipt", label: "Receipt", Icon: FiClipboard },
  { value: "invoice", label: "Invoice", Icon: FiFileText },
  { value: "mobile", label: "Mobile Pay", Icon: FiSmartphone },
  { value: "secure", label: "Secure Pay", Icon: FiShield },
];

export const PAYMENT_METHOD_ICON_MAP: Record<TPaymentTemplateIcon, IconType> =
  PAYMENT_METHOD_ICON_OPTIONS.reduce((acc, item) => {
    acc[item.value] = item.Icon;
    return acc;
  }, {} as Record<TPaymentTemplateIcon, IconType>);

export function getPaymentMethodIcon(iconName?: string): IconType {
  const iconKey = (iconName || "card") as TPaymentTemplateIcon;
  return PAYMENT_METHOD_ICON_MAP[iconKey] || PAYMENT_METHOD_ICON_MAP.card;
}
