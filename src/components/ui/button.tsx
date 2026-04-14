"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold-600 text-white hover:bg-gold-700 active:bg-gold-800 focus-visible:ring-gold-500",
  secondary:
    "border border-gold-300 text-gold-700 bg-white hover:bg-gold-50 active:bg-gold-100 focus-visible:ring-gold-500",
  ghost:
    "text-gold-700 hover:bg-gold-50 active:bg-gold-100 focus-visible:ring-gold-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm px-3 min-h-[44px] sm:min-h-[36px]",
  md: "text-sm px-4 min-h-[44px]",
  lg: "text-base px-6 min-h-[48px]",
};

const spinnerColorMap: Record<ButtonVariant, "sm" | "md"> = {
  primary: "sm",
  secondary: "sm",
  ghost: "sm",
  danger: "sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            className={clsx(
              variant === "primary" || variant === "danger"
                ? "border-white/30 border-t-white"
                : "border-gold-200 border-t-gold-600",
            )}
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
