/** stock > 0 = cupos limitados; stock <= 0 = sin cupos para reserva online */
export function hasAvailableStock(stock: number): boolean {
  return stock > 0;
}

export function stockAvailabilityLabel(stock: number): string {
  if (stock <= 0) return "Sin cupos";
  if (stock === 1) return "Queda 1 lugar";
  if (stock <= 5) return `Quedan ${stock} lugares`;
  return `${stock} lugares disponibles`;
}

export function canAddQuantity(currentInCart: number, toAdd: number, stock: number): boolean {
  if (!hasAvailableStock(stock)) return false;
  return currentInCart + toAdd <= stock;
}
