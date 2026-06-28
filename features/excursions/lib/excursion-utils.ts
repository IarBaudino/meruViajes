import type { Service } from "@/types";

export function getServiceCategories(services: Service[]): string[] {
  const set = new Set<string>();
  for (const s of services) {
    if (s.category) set.add(s.category);
  }
  return Array.from(set).sort();
}
