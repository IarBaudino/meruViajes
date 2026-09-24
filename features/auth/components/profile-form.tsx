"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  billingToFormValues,
  normalizeBilling,
  parseStoredBilling,
  type OrderBillingFormData,
} from "@/schemas/billing";
import { profileSchema, type ProfileFormData } from "@/schemas/user";
import { BillingFormFields } from "@/features/checkout/components/billing-form-fields";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileForm() {
  const { data: session } = useSession();
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneCountryCode: "+54",
      phoneNumber: "",
      identificationType: "DNI",
      identificationNumber: "",
      addressCountry: "Argentina",
      addressCity: "",
      addressStreet: "",
      addressApartment: "",
      addressPostalCode: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) {
          throw new Error("No se pudo cargar el perfil");
        }
        const data = await res.json();
        const stored = parseStoredBilling(data.billing);
        const email = data.email ?? session?.user?.email ?? "";
        const name = data.name ?? "";
        const formBilling = billingToFormValues(stored, {
          fullName: name,
          email,
          phoneNumber: data.phone ?? "",
          identificationNumber: data.dni ?? "",
          addressStreet: typeof data.address === "string" ? data.address : "",
        });

        reset({
          name: name || formBilling.fullName,
          email: email || formBilling.email,
          phoneCountryCode: formBilling.phoneCountryCode,
          phoneNumber: formBilling.phoneNumber,
          identificationType: formBilling.identificationType,
          identificationNumber: formBilling.identificationNumber,
          addressCountry: formBilling.addressCountry,
          addressCity: formBilling.addressCity,
          addressStreet: formBilling.addressStreet,
          addressApartment: formBilling.addressApartment,
          addressPostalCode: formBilling.addressPostalCode,
        });
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Error al cargar");
      }
    }

    if (session?.user) {
      void loadProfile();
    }
  }, [session, reset]);

  async function onSubmit(data: ProfileFormData) {
    setSaveStatus("idle");
    setSaveError("");

    try {
      const billingPayload: OrderBillingFormData = {
        fullName: data.name,
        email: data.email,
        phoneCountryCode: data.phoneCountryCode,
        phoneNumber: data.phoneNumber,
        identificationType: data.identificationType,
        identificationNumber: data.identificationNumber,
        addressCountry: data.addressCountry,
        addressCity: data.addressCity,
        addressStreet: data.addressStreet,
        addressApartment: data.addressApartment,
        addressPostalCode: data.addressPostalCode,
      };
      const billing = normalizeBilling(billingPayload);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          billing: billingPayload,
          dni: billing.identificationNumber,
          phone: billing.phoneFull,
          address: `${billing.address.street}${
            billing.address.apartment ? `, ${billing.address.apartment}` : ""
          }, ${billing.address.city}, ${billing.address.country} (${billing.address.postalCode})`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al guardar");
      }
      setSaveStatus("success");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (loadError) {
    return <p className="text-red-600">{loadError}</p>;
  }

  // BillingFormFields espera OrderBillingFormData; casteamos register/errors
  // porque fullName/email viven en name/email del perfil.
  const billingRegister = register as unknown as Parameters<
    typeof BillingFormFields
  >[0]["register"];
  const billingErrors = errors as unknown as Parameters<
    typeof BillingFormFields
  >[0]["errors"];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8" noValidate>
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-medium text-meru-charcoal">Datos personales</h2>
          <p className="mt-1 text-sm text-meru-muted">
            Nombre y correo de tu cuenta. El nombre también se usa en la facturación.
          </p>
        </div>
        <Input label="Nombre completo" error={errors.name?.message} {...register("name")} />
        <Input
          label="Correo electrónico"
          type="email"
          disabled
          error={errors.email?.message}
          {...register("email")}
        />
      </section>

      <section className="space-y-5 border-t border-meru-border pt-8">
        <div>
          <h2 className="text-base font-medium text-meru-charcoal">Datos de facturación</h2>
          <p className="mt-1 text-sm text-meru-muted">
            Se autocompletan al comprar. Podés actualizarlos cuando quieras.
          </p>
        </div>
        <BillingFormFields register={billingRegister} errors={billingErrors} hideIdentity />
      </section>

      {saveStatus === "success" && (
        <p className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" aria-hidden />
          Perfil actualizado.
        </p>
      )}
      {saveStatus === "error" && (
        <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {saveError}
        </p>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Guardar cambios
      </Button>
    </form>
  );
}
