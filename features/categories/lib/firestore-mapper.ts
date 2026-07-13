import type { DocumentData } from "firebase-admin/firestore";
import type { ServiceCategory } from "@/types/catalog";

export const SERVICE_CATEGORIES_COLLECTION = "serviceCategories";

export function mapFirestoreCategory(id: string, data: DocumentData): ServiceCategory {
  return {
    id,
    name: typeof data.name === "string" ? data.name : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    description: typeof data.description === "string" ? data.description : undefined,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    visible: data.visible !== false,
  };
}

export function categoryToFirestore(
  data: Omit<ServiceCategory, "id">
): DocumentData {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    sortOrder: data.sortOrder,
    visible: data.visible,
  };
}
