"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { profileSchema, type ProfileFormData } from "@/schemas/user";
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
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) {
          throw new Error("No se pudo cargar el perfil");
        }
        const data = await res.json();
        reset({
          name: data.name ?? "",
          email: data.email ?? session?.user?.email ?? "",
          dni: data.dni ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
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
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
      <Input label="Nombre completo" error={errors.name?.message} {...register("name")} />
      <Input
        label="Correo electrónico"
        type="email"
        disabled
        error={errors.email?.message}
        {...register("email")}
      />
      <Input label="DNI / Pasaporte" error={errors.dni?.message} {...register("dni")} />
      <Input label="Teléfono" type="tel" error={errors.phone?.message} {...register("phone")} />
      <Input label="Dirección" error={errors.address?.message} {...register("address")} />

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
