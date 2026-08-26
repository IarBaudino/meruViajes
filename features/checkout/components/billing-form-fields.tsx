"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import {
  IDENTIFICATION_TYPES,
  PHONE_COUNTRY_CODES,
  type OrderBillingFormData,
} from "@/schemas/billing";
import { Input } from "@/components/ui/input";

type Props = {
  register: UseFormRegister<OrderBillingFormData>;
  errors: FieldErrors<OrderBillingFormData>;
  /** Si true, oculta nombre/email (cuando ya están en otra sección). */
  hideIdentity?: boolean;
};

export function BillingFormFields({ register, errors, hideIdentity = false }: Props) {
  return (
    <div className="space-y-5">
      {!hideIdentity ? (
        <>
          <Input
            label="Nombre completo"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register("email")}
          />
        </>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-meru-charcoal">
            Código país
          </label>
          <select
            className="w-full rounded-lg border border-meru-border bg-white px-3 py-2.5 text-meru-charcoal"
            {...register("phoneCountryCode")}
          >
            {PHONE_COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.phoneCountryCode?.message ? (
            <p className="mt-1 text-xs text-red-600">{errors.phoneCountryCode.message}</p>
          ) : null}
        </div>
        <Input
          label="Teléfono (WhatsApp)"
          placeholder="11 5555 5555"
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-meru-charcoal">
            Tipo de identificación
          </label>
          <select
            className="w-full rounded-lg border border-meru-border bg-white px-3 py-2.5 text-meru-charcoal"
            {...register("identificationType")}
          >
            {IDENTIFICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {errors.identificationType?.message ? (
            <p className="mt-1 text-xs text-red-600">{errors.identificationType.message}</p>
          ) : null}
        </div>
        <Input
          label="Nº de identificación"
          error={errors.identificationNumber?.message}
          {...register("identificationNumber")}
        />
      </div>

      <div className="space-y-4 border-t border-meru-border pt-5">
        <h3 className="text-base text-meru-charcoal">Dirección</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="País"
            error={errors.addressCountry?.message}
            {...register("addressCountry")}
          />
          <Input
            label="Ciudad"
            error={errors.addressCity?.message}
            {...register("addressCity")}
          />
        </div>
        <Input
          label="Calle y número"
          error={errors.addressStreet?.message}
          {...register("addressStreet")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Departamento (opcional)"
            error={errors.addressApartment?.message}
            {...register("addressApartment")}
          />
          <Input
            label="Código postal"
            error={errors.addressPostalCode?.message}
            {...register("addressPostalCode")}
          />
        </div>
      </div>
    </div>
  );
}
