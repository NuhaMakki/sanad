import { clsx } from "clsx";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "navy";

const RISK_LEVEL_MAP: Record<string, Variant> = {
  SAFE: "success",
  NORMAL: "default",
  EARLY_RISK: "info",
  PROBABLE_RISK: "warning",
  HIGH_RISK: "danger",
};

const TICKET_STATUS_MAP: Record<string, Variant> = {
  WAITING: "info",
  SERVING: "warning",
  RESOLVED: "success",
  CANCELLED: "default",
  NO_SHOW: "danger",
};

const variants: Record<Variant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  navy: "bg-navy-100 text-navy-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const LABELS: Record<string, string> = {
    SAFE: "آمن",
    NORMAL: "عادي",
    EARLY_RISK: "خطر مبكر",
    PROBABLE_RISK: "خطر محتمل",
    HIGH_RISK: "خطر مرتفع",
  };
  return <Badge variant={RISK_LEVEL_MAP[level] ?? "default"}>{LABELS[level] ?? level}</Badge>;
}

export function TicketStatusBadge({ status }: { status: string }) {
  const LABELS: Record<string, string> = {
    WAITING: "في الانتظار",
    SERVING: "يُخدم الآن",
    RESOLVED: "منجز",
    CANCELLED: "ملغى",
    NO_SHOW: "لم يحضر",
  };
  return <Badge variant={TICKET_STATUS_MAP[status] ?? "default"}>{LABELS[status] ?? status}</Badge>;
}
