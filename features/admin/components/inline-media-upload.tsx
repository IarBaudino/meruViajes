"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { uploadAdminMedia, type UploadProgress } from "@/lib/admin-media-upload";
import type { StorageFolder } from "@/lib/storage/storage-folders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadProgressState = UploadProgress & { fileName?: string };

type SingleImageUploadProps = {
  folder: StorageFolder;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  accept?: string;
};

export function SingleImageUpload({
  folder,
  value,
  onChange,
  label = "Imagen",
  hint,
  accept = "image/*",
}: SingleImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      setProgress({ phase: "uploading", progress: 0, message: "Subiendo…", fileName: file.name });

      const result = await uploadAdminMedia(file, folder, setProgress);
      setBusy(false);
      setProgress(null);

      if (!result.success || !result.url) {
        setError(result.error ?? "Error al subir");
        return;
      }

      onChange(result.url);
    },
    [folder, onChange]
  );

  return (
    <div className="space-y-3">
      {label ? (
        <p className="text-sm font-medium text-meru-charcoal">{label}</p>
      ) : null}
      {hint ? <p className="text-xs text-meru-muted">{hint}</p> : null}

      {value ? (
        <div className="relative inline-block">
          <div className="relative h-40 w-full max-w-md overflow-hidden rounded-lg border border-meru-border bg-meru-sand">
            <Image src={value} alt="" fill className="object-cover" sizes="400px" />
          </div>
          <button
            type="button"
            className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 shadow-md hover:bg-red-50"
            onClick={() => onChange("")}
            aria-label="Quitar imagen"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.target.value = "";
        }}
      />

      {progress ? (
        <div className="max-w-md">
          <p className="text-xs text-meru-muted">{progress.message}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-meru-ice">
            <div
              className="h-full bg-meru-primary transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Subiendo…
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" aria-hidden />
            {value ? "Cambiar imagen" : "Subir imagen"}
          </>
        )}
      </Button>
    </div>
  );
}

type PhotoGalleryUploadProps = {
  folder: StorageFolder;
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
  hint?: string;
  accept?: string;
};

export function PhotoGalleryUpload({
  folder,
  photos,
  onChange,
  label = "Fotos",
  hint = "Subí todas las que quieras. Se comprimen automáticamente.",
  accept = "image/*",
}: PhotoGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<UploadProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(
    async (files: FileList) => {
      setBusy(true);
      setError(null);
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]!;
        setProgress({
          phase: "uploading",
          progress: Math.round((i / files.length) * 100),
          message: `Subiendo ${i + 1} de ${files.length}…`,
          fileName: file.name,
        });

        const result = await uploadAdminMedia(file, folder, (p) =>
          setProgress({ ...p, fileName: file.name })
        );

        if (result.success && result.url) {
          newUrls.push(result.url);
        } else {
          setError(result.error ?? `Error al subir ${file.name}`);
          break;
        }
      }

      if (newUrls.length > 0) {
        onChange([...photos, ...newUrls]);
      }

      setBusy(false);
      setProgress(null);
    },
    [folder, onChange, photos]
  );

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {label ? <p className="text-sm font-medium text-meru-charcoal">{label}</p> : null}
      {hint ? <p className="text-xs text-meru-muted">{hint}</p> : null}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-meru-border bg-meru-sand"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="200px" />
              <button
                type="button"
                className={cn(
                  "absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1.5 shadow",
                  "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                )}
                onClick={() => removeAt(index)}
                aria-label="Quitar foto"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-meru-muted">Todavía no hay fotos.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {progress ? (
        <div className="max-w-md">
          <p className="text-xs text-meru-muted">{progress.message}</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-meru-ice">
            <div
              className="h-full bg-meru-primary transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Subiendo…
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" aria-hidden />
            Agregar fotos
          </>
        )}
      </Button>
    </div>
  );
}
