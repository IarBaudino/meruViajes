"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <div className="w-full">
        {label ? (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor={inputId} className="text-sm font-medium text-meru-charcoal">
              {label}
            </label>
            <button
              type="button"
              className="text-xs font-medium text-meru-secondary hover:underline"
              onClick={() => setVisible((v) => !v)}
              aria-pressed={visible}
            >
              {visible ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        ) : null}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "w-full rounded-lg border border-meru-border bg-white px-4 py-2.5 pr-11 text-meru-charcoal",
              "placeholder:text-meru-muted/70 focus:border-meru-primary focus:ring-2 focus:ring-meru-primary/25",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-meru-muted hover:bg-meru-ice hover:text-meru-charcoal"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
