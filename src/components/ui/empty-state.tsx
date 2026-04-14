import type { ReactNode, ElementType } from "react";
import clsx from "clsx";

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center px-4 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand-100">
          <Icon className="h-7 w-7 text-sand-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-sand-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-sand-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
