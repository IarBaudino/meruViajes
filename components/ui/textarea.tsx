import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-meru-charcoal">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={5}
          className={cn(
            "w-full resize-y rounded-lg border border-meru-border bg-white px-4 py-2.5 text-meru-charcoal",
            "placeholder:text-meru-muted/70 focus:border-meru-primary focus:ring-2 focus:ring-meru-primary/25",
            error && "border-red-500",
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
