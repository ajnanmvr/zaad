import { TPaymentTemplateIcon } from "@/config/templateVisuals";
import { getPaymentMethodIcon } from "@/config/paymentMethodIcons";
import clsx from "clsx";

type TPaymentMethodBadgeProps = {
  label: string;
  icon?: string;
  color?: string;
  size?: "sm" | "md";
  muted?: boolean;
};

function normalizeHexColor(value?: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(trimmed) ? trimmed : undefined;
}

function withAlpha(hexColor: string, alphaHex: string) {
  return `${hexColor}${alphaHex}`;
}

const PaymentMethodBadge = ({
  label,
  icon,
  color,
  size = "md",
  muted = false,
}: TPaymentMethodBadgeProps) => {
  const normalizedColor = normalizeHexColor(color);
  const iconKey = (icon || "card") as TPaymentTemplateIcon;
  const Icon = getPaymentMethodIcon(iconKey);

  const shellClass = size === "sm" ? "gap-1.5 px-2.5 py-1 text-xs" : "gap-2 px-3 py-1.5 text-sm";
  const iconWrapClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const iconClass = size === "sm" ? "text-[10px]" : "text-[11px]";

  const dynamicStyles = normalizedColor
    ? {
        backgroundColor: muted
          ? withAlpha(normalizedColor, "12")
          : withAlpha(normalizedColor, "1A"),
        color: normalizedColor,
        borderColor: withAlpha(normalizedColor, "3D"),
      }
    : undefined;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg border font-semibold capitalize whitespace-nowrap",
        shellClass,
        !normalizedColor &&
          "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
      )}
      style={dynamicStyles}
      title={label}
    >
      <span
        className={clsx(
          "inline-flex items-center justify-center rounded-md",
          iconWrapClass,
          !normalizedColor &&
            "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
        )}
        style={
          normalizedColor
            ? { backgroundColor: withAlpha(normalizedColor, "26") }
            : undefined
        }
      >
        <Icon className={iconClass} />
      </span>
      <span className="max-w-[10rem] truncate">{label}</span>
    </span>
  );
};

export default PaymentMethodBadge;
