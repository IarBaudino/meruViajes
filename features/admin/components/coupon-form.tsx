"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { couponSchema, type CouponAppliesTo, type CouponFormData } from "@/schemas/coupon";
import type { Coupon } from "@/types/coupon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  coupon?: Coupon;
};

const PRODUCT_OPTIONS: Array<{ id: CouponAppliesTo; label: string }> = [
  { id: "groupTrip", label: "Viajes grupales" },
  { id: "package", label: "Paquetes" },
  { id: "excursion", label: "Excursiones" },
];

function toDefaults(coupon?: Coupon): CouponFormData {
  return {
    code: coupon?.code ?? "",
    sellerName: coupon?.sellerName ?? "",
    note: coupon?.note ?? "",
    discountType: coupon?.discountType ?? "percent",
    discountValue: coupon?.discountValue ?? 10,
    commissionPercent: coupon?.commissionPercent ?? 0,
    maxUses: coupon?.maxUses ?? 0,
    startsAt: coupon?.startsAt ?? "",
    endsAt: coupon?.endsAt ?? "",
    appliesTo: coupon?.appliesTo?.length
      ? coupon.appliesTo
      : ["excursion", "package", "groupTrip"],
    active: coupon?.active ?? true,
  };
}

export function CouponForm({ coupon }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const isEdit = Boolean(coupon?.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema) as Resolver<CouponFormData>,
    defaultValues: toDefaults(coupon),
  });

  const discountType = watch("discountType");
  const appliesTo = watch("appliesTo") ?? [];

  function toggleApplies(kind: CouponAppliesTo, checked: boolean) {
    const next = checked
      ? Array.from(new Set([...appliesTo, kind]))
      : appliesTo.filter((item) => item !== kind);
    setValue("appliesTo", next, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(data: CouponFormData) {
    setError("");
    const url = isEdit ? `/api/admin/coupons/${coupon!.id}` : "/api/admin/coupons";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        code: data.code.trim().toUpperCase(),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Error al guardar");
      return;
    }
    router.push("/admin/cupones");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-5 rounded-xl border border-brand-border bg-white p-6">
        <h2 className="text-lg text-brand-charcoal">Cupón de vendedora</h2>
        <p className="text-sm text-brand-muted">
          Cada vendedora puede tener un código. La clienta paga con descuento y vos ves la comisión
          de esa venta en la orden.
        </p>
        <Input
          label="Código"
          placeholder="MARIA10"
          error={errors.code?.message}
          {...register("code")}
        />
        <Input
          label="Vendedora / canal"
          placeholder="María, agencia aliada…"
          error={errors.sellerName?.message}
          {...register("sellerName")}
        />
        <Textarea label="Nota interna (opcional)" rows={2} {...register("note")} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-brand-charcoal">
              Tipo de descuento
            </label>
            <select
              className="w-full rounded-lg border border-brand-border bg-white px-4 py-2.5 text-brand-charcoal"
              {...register("discountType")}
            >
              <option value="percent">Porcentaje</option>
              <option value="fixed">Monto fijo (ARS)</option>
            </select>
          </div>
          <Input
            label={discountType === "fixed" ? "Descuento (ARS)" : "Descuento (%)"}
            type="number"
            error={errors.discountValue?.message}
            {...register("discountValue", { valueAsNumber: true })}
          />
          <Input
            label="Comisión de la vendedora (%)"
            type="number"
            error={errors.commissionPercent?.message}
            {...register("commissionPercent", { valueAsNumber: true })}
          />
          <Input
            label="Máximo de usos (0 = sin tope)"
            type="number"
            {...register("maxUses", { valueAsNumber: true })}
          />
          <Input label="Válido desde" type="date" {...register("startsAt")} />
          <Input label="Válido hasta" type="date" {...register("endsAt")} />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-brand-charcoal">Aplica a</p>
          <ul className="space-y-2">
            {PRODUCT_OPTIONS.map((option) => (
              <li key={option.id}>
                <label className="flex items-center gap-2 text-sm text-brand-charcoal">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={appliesTo.includes(option.id)}
                    onChange={(e) => toggleApplies(option.id, e.target.checked)}
                  />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
          {errors.appliesTo?.message ? (
            <p className="mt-1 text-sm text-red-600">{errors.appliesTo.message}</p>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-charcoal">
          <input type="checkbox" className="rounded" {...register("active")} />
          Activo
        </label>
        {isEdit && coupon ? (
          <p className="text-sm text-brand-muted">Usos: {coupon.usedCount}</p>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" isLoading={isSubmitting}>
        {isEdit ? "Guardar cupón" : "Crear cupón"}
      </Button>
    </form>
  );
}
