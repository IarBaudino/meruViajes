"use client";

import type { Season } from "@/types";

const OPTIONS: Array<{ value: Season; label: string; description: string }> = [
  { value: "verano", label: "Verano", description: "Se muestra en el menú de verano." },
  { value: "invierno", label: "Invierno", description: "Se muestra en el menú de invierno." },
  {
    value: "todo-el-ano",
    label: "Todo el año",
    description: "Se muestra en verano e invierno.",
  },
];

type Props = {
  value: Season[];
  onChange: (next: Season[]) => void;
};

export function SeasonSelector({ value, onChange }: Props) {
  function toggle(season: Season, checked: boolean) {
    if (season === "todo-el-ano") {
      onChange(checked ? ["todo-el-ano"] : ["verano"]);
      return;
    }

    const base = value.filter((item) => item !== "todo-el-ano");
    const next = checked
      ? Array.from(new Set([...base, season]))
      : base.filter((item) => item !== season);
    onChange(next.length > 0 ? next : ["todo-el-ano"]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-meru-charcoal">Temporada</legend>
      <p className="mt-1 text-xs text-meru-muted">
        Define en qué menú aparece. “Todo el año” incluye verano e invierno.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-2 rounded-lg border border-meru-border p-3 hover:bg-meru-ice/50"
          >
            <input
              type="checkbox"
              className="mt-0.5 rounded"
              checked={value.includes(option.value)}
              onChange={(event) => toggle(option.value, event.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-meru-charcoal">{option.label}</span>
              <span className="block text-xs text-meru-muted">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
