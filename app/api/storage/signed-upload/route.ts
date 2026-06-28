import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import {
  createSignedVideoUpload,
  randomStorageId,
} from "@/lib/storage/supabase-server";
import { getPublicStorageUrl, isStorageFolder } from "@/lib/storage/storage-folders";

const bodySchema = z.object({
  folder: z.string(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  extension: z.string().min(1).max(8),
  resourceType: z.enum(["video", "image"]),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { folder, contentType, extension, resourceType } = parsed.data;

    if (resourceType !== "video") {
      return NextResponse.json(
        { error: "Usá POST /api/upload-image para imágenes" },
        { status: 400 }
      );
    }

    if (!isStorageFolder(folder)) {
      return NextResponse.json({ error: "Carpeta inválida" }, { status: 400 });
    }

    const safeExt = extension.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    const path = `${folder}/${randomStorageId()}.${safeExt}`;

    const signed = await createSignedVideoUpload(path);

    return NextResponse.json({
      success: true,
      path: signed.path,
      token: signed.token,
      signedUrl: signed.signedUrl,
      url: getPublicStorageUrl(path),
      contentType,
      optimized: true,
    });
  } catch (error) {
    console.error("[signed-upload]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear subida firmada" },
      { status: 500 }
    );
  }
}
