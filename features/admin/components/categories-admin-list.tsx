"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ServiceCategory } from "@/types/catalog";
import {
  serviceCategorySchema,
  type ServiceCategoryFormData,
} from "@/schemas/service-category";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/utils/slugify";

export function CategoriesAdminList() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<ServiceCategoryFormData>({
    resolver: zodResolver(serviceCategorySchema) as Resolver<ServiceCategoryFormData>,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      sortOrder: 0,
      visible: true,
    },
  });

  const name = watch("name");

  useEffect(() => {
    if (!editingId && name) {
      setValue("slug", slugify(name));
    }
  }, [name, editingId, setValue]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch {
      setError("No se pudieron cargar los grupos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(category: ServiceCategory) {
    setEditingId(category.id);
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      sortOrder: category.sortOrder,
      visible: category.visible,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    reset({
      name: "",
      slug: "",
      description: "",
      sortOrder: categories.length,
      visible: true,
    });
  }

  async function onSubmit(data: ServiceCategoryFormData) {
    setActionError("");
    const url = editingId
      ? `/api/admin/categories/${editingId}`
      : "/api/admin/categories";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        description: data.description || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo guardar");
      return;
    }

    cancelEdit();
    await load();
  }

  async function setVisible(id: string, visible: boolean) {
    setActionError("");
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo actualizar");
      return;
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible } : c))
    );
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar el grupo "${name}"? Las excursiones no se borran.`)) return;
    setActionError("");
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error ?? "No se pudo eliminar");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Grupos de excursiones"
        description="Trekking, Convencionales, Experiencias, etc. Podés ocultar un grupo del catálogo público."
      />

      {actionError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 space-y-4 rounded-xl border border-meru-border bg-white p-6"
      >
        <h2 className="text-lg text-meru-charcoal">
          {editingId ? "Editar grupo" : "Nuevo grupo"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" error={errors.name?.message} {...register("name")} />
          <Input label="Slug" error={errors.slug?.message} {...register("slug")} />
          <Input
            label="Orden"
            type="number"
            {...register("sortOrder", { valueAsNumber: true })}
          />
          <label className="flex items-end gap-2 pb-2 text-sm text-meru-charcoal">
            <input type="checkbox" className="rounded" {...register("visible")} />
            Visible en el catálogo
          </label>
        </div>
        <Textarea label="Descripción (opcional)" rows={2} {...register("description")} />
        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {editingId ? "Guardar cambios" : "Crear grupo"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
          ) : null}
        </div>
      </form>

      {loading ? <p className="text-meru-muted">Cargando…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-meru-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-meru-border bg-meru-sand/50 text-left text-meru-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Orden</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-meru-border/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-meru-charcoal">{category.name}</p>
                  <p className="text-xs text-meru-muted">/{category.slug}</p>
                </td>
                <td className="px-4 py-3 text-meru-muted">{category.sortOrder}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      category.visible
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {category.visible ? "Visible" : "Oculto"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <button
                      type="button"
                      className="text-meru-secondary hover:underline"
                      onClick={() => startEdit(category)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-amber-700 hover:underline"
                      onClick={() => void setVisible(category.id, !category.visible)}
                    >
                      {category.visible ? "Ocultar" : "Mostrar"}
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => void remove(category.id, category.name)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && categories.length === 0 ? (
        <p className="mt-4 text-sm text-meru-muted">
          Todavía no hay grupos. Creá por ejemplo: Trekking, Convencionales, Experiencias.
        </p>
      ) : null}
    </div>
  );
}
