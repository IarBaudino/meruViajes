import type { DocumentData } from "firebase-admin/firestore";
import type { ExcursionPackage } from "@/types/catalog";
import type { Season } from "@/types";

export const PACKAGES_COLLECTION = "packages";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapSeasons(value: unknown): Season[] {
  if (!Array.isArray(value)) return ["todo-el-ano"];
  const valid = value.filter(
    (season): season is Season =>
      season === "verano" || season === "invierno" || season === "todo-el-ano"
  );
  return valid.length > 0 ? valid : ["todo-el-ano"];
}

export function mapFirestorePackage(id: string, data: DocumentData): ExcursionPackage {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : 0,
    photos: asStringArray(data.photos),
    serviceIds: asStringArray(data.serviceIds),
    stock: typeof data.stock === "number" ? data.stock : 0,
    active: data.active !== false,
    featuredOnHome: data.featuredOnHome === true,
    homeOrder: typeof data.homeOrder === "number" ? data.homeOrder : 100,
    category: typeof data.category === "string" ? data.category : undefined,
    seasons: mapSeasons(data.seasons),
  };
}

export function packageToFirestore(
  data: Omit<ExcursionPackage, "id">
): DocumentData {
  return {
    title: data.title,
    slug: data.slug,
    description: data.description,
    price: data.price,
    photos: data.photos,
    serviceIds: data.serviceIds,
    stock: data.stock,
    active: data.active,
    featuredOnHome: data.featuredOnHome === true,
    homeOrder: Number.isFinite(data.homeOrder) ? Number(data.homeOrder) : 100,
    category: data.category ?? null,
    seasons: data.seasons?.length ? data.seasons : ["todo-el-ano"],
  };
}
