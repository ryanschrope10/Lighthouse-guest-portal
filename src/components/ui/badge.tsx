import clsx from "clsx";
import type { ReactNode } from "react";

type BadgeStatus = "success" | "warning" | "danger" | "neutral" | "info";

interface BadgeProps {
  status?: BadgeStatus;
  children: ReactNode;
  className?: string;
}

const statusClasses: Record<BadgeStatus, string> = {
  success: "bg-green-50 text-green-700 ring-green-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  neutral: "bg-sand-100 text-sand-700 ring-sand-500/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

export function Badge({ status = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusClasses[status],
        className,
      )}
    >
      {children}
    </span>
  );
}
