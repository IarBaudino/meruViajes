import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { compressImageForWeb } from "@/lib/storage/compress-image";
import {
  ALLOWED_IMAGE_MIME,
  isStorageFolder,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/storage/storage-folders";
import { randomStorageId, uploadBufferToStorage } from "@/lib/storage/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }
    if (typeof folderRaw !== "string" || !isStorageFolder(folderRaw)) {
      return NextResponse.json({ error: "Carpeta inválida" }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)} MB por imagen` },
        { status: 400 }
      );
    }

    const mime = file.type || "application/octet-stream";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const heicLike = ["heic", "heif"].includes(ext);
    if (
      !heicLike &&
      !ALLOWED_IMAGE_MIME.has(mime) &&
      !mime.startsWith("image/")
    ) {
      return NextResponse.json({ error: "Formato de imagen no soportado" }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const compressed = await compressImageForWeb(input, folderRaw);
    const path = `${folderRaw}/${randomStorageId()}.${compressed.extension}`;

    const { url } = await uploadBufferToStorage(
      compressed.buffer,
      path,
      compressed.contentType
    );

    return NextResponse.json({
      success: true,
      publicId: path,
      url,
      width: compressed.width,
      height: compressed.height,
      resourceType: "image",
      optimized: !compressed.passthrough,
    });
  } catch (error) {
    console.error("[upload-image]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar imagen" },
      { status: 500 }
    );
  }
}
