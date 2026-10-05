"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  labelForPhoneCountryCode,
  phoneCountryByIso,
  searchPhoneCountries,
  type PhoneCountry,
} from "@/lib/phone/country-calling-codes";

type Props = {
  value: string;
  onChange: (code: string) => void;
  onBlur?: () => void;
  error?: string;
};

export function PhoneCountryCodeField({ value, onChange, onBlur, error }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIso, setSelectedIso] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedIso) return;
    const selected = phoneCountryByIso(selectedIso);
    if (!selected || selected.code !== value) setSelectedIso(undefined);
  }, [selectedIso, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const results = useMemo(() => searchPhoneCountries(query), [query]);
  const label = labelForPhoneCountryCode(value, selectedIso);

  function choose(country: PhoneCountry) {
    setSelectedIso(country.iso);
    onChange(country.code);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-meru-charcoal">Código país</label>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-meru-border bg-white px-3 py-2.5 text-left text-sm text-meru-charcoal"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onBlur={onBlur}
      >
        <span className="truncate">{label}</span>
        <span className="ml-2 text-meru-muted" aria-hidden>
          ▾
        </span>
      </button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      {open ? (
        <div className="absolute z-30 mt-1 w-[min(100vw-2rem,20rem)] rounded-lg border border-meru-border bg-white p-2 shadow-lg">
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar país o código"
            className="w-full rounded-md border border-meru-border px-3 py-2 text-sm text-meru-charcoal outline-none focus:border-meru-primary"
            aria-label="Buscar código de país"
          />
          <ul id={listId} className="mt-2 max-h-64 overflow-y-auto" role="listbox">
            {results.frequent.length > 0 ? (
              <li className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-meru-muted">
                Frecuentes
              </li>
            ) : null}
            {results.frequent.map((country) => (
              <CountryOption key={`freq-${country.iso}`} country={country} onChoose={choose} />
            ))}
            {results.frequent.length > 0 ? (
              <li className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-meru-muted">
                Todos
              </li>
            ) : null}
            {results.matches.map((country) => (
              <CountryOption key={country.iso} country={country} onChoose={choose} />
            ))}
            {results.matches.length === 0 ? (
              <li className="px-2 py-3 text-sm text-meru-muted">No hay países con esa búsqueda.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CountryOption({
  country,
  onChoose,
}: {
  country: PhoneCountry;
  onChoose: (country: PhoneCountry) => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm text-meru-charcoal hover:bg-meru-ice"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onChoose(country)}
      >
        <span>{country.name}</span>
        <span className="ml-3 text-meru-muted">{country.code}</span>
      </button>
    </li>
  );
}
