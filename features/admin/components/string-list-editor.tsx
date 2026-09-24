"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  error?: string;
};

export function StringListEditor({ label, hint, values, onChange, placeholder, error }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-brand-charcoal">{label}</p>
      {hint ? <p className="text-xs text-brand-muted">{hint}</p> : null}
      <ul className="space-y-2">
        {values.map((value, index) => (
          <li key={index} className="flex gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[index] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
            >
              Quitar
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ""])}>
        Agregar ítem
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
