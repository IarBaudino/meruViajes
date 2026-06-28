"use client";

import { useCallback, useRef, useState } from "react";
import { uploadAdminMedia, type UploadProgress } from "@/lib/admin-media-upload";
import type { StorageFolder } from "@/lib/storage/storage-folders";
import { STORAGE_FOLDERS } from "@/lib/storage/storage-folders";
import { Button } from "@/components/ui/button";

type Props = {
  folder?: StorageFolder;
  accept?: string;
  onUploaded?: (result: {
    url: string;
    publicId: string;
    resourceType: "image" | "video";
  }) => void;
};

export function AdminMediaUploader({
  folder: defaultFolder = "excursions",
  accept = "image/*,video/*",
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<StorageFolder>(defaultFolder);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      setBusy(true);
      setError(null);
      setProgress(null);
      setLastUrl(null);

      const result = await uploadAdminMedia(file, folder, setProgress);

      setBusy(false);

      if (!result.success || !result.url || !result.publicId) {
        setError(result.error ?? "Error desconocido");
        return;
      }

      setLastUrl(result.url);
      onUploaded?.({
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
      });
    },
    [folder, onUploaded]
  );

  return (
    <div className="rounded-xl border border-meru-border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-meru-charcoal">Subir imagen o vídeo</h2>
      <p className="mt-1 text-sm text-meru-muted">
        Imágenes: compresión WebP en servidor. Vídeos: H.264 en el navegador antes de subir.
      </p>

      <div className="mt-4">
        <label htmlFor="media-folder" className="text-sm font-medium text-meru-charcoal">
          Carpeta
        </label>
        <select
          id="media-folder"
          value={folder}
          onChange={(e) => setFolder(e.target.value as StorageFolder)}
          className="mt-1 w-full rounded-lg border border-meru-border px-3 py-2"
          disabled={busy}
        >
          {STORAGE_FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={busy}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {progress && (
        <div className="mt-4" role="status">
          <p className="text-sm font-medium text-meru-charcoal">{progress.message}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-meru-ice">
            <div
              className="h-full bg-meru-primary transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {lastUrl && (
        <p className="mt-4 break-all text-sm text-meru-secondary">
          Subido:{" "}
          <a href={lastUrl} target="_blank" rel="noreferrer" className="underline">
            {lastUrl}
          </a>
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="mt-4"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        Elegir archivo
      </Button>
    </div>
  );
}
