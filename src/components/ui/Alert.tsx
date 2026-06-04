import { clsx } from "clsx";
import { ReactNode } from "react";

type AlertVariant = "error" | "warning" | "success" | "info";

const styles: Record<AlertVariant, string> = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-green-50 border-green-200 text-green-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className }: AlertProps) {
  return (
    <div className={clsx("rounded-lg border p-4 text-sm", styles[variant], className)}>
      {children}
    </div>
  );
}
