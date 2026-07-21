import { redirect } from "next/navigation";

/** Las categorías se cargan al crear/editar cada excursión. */
export default function AdminCategoriesRedirectPage() {
  redirect("/admin/excursiones");
}
