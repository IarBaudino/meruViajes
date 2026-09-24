import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variants = {
  primary:
    "border-2 border-brand-charcoal bg-white text-brand-charcoal hover:bg-brand-sand focus-visible:ring-brand-charcoal",
  secondary:
    "border-2 border-brand-secondary bg-brand-surface text-brand-secondary hover:bg-brand-sand focus-visible:ring-brand-secondary",
  outline:
    "border-2 border-brand-charcoal text-brand-charcoal hover:bg-brand-sand",
  ghost: "text-brand-charcoal hover:bg-brand-sand",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? "Enviando…" : children}
    </button>
  )
);

Button.displayName = "Button";
