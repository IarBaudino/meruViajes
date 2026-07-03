import { stockAvailabilityLabel, hasAvailableStock } from "@/lib/excursions/stock";
import { cn } from "@/lib/utils";

type Props = {
  stock: number;
  className?: string;
};

export function ExcursionStockLabel({ stock, className }: Props) {
  const available = hasAvailableStock(stock);

  return (
    <p
      className={cn(
        "text-sm font-medium",
        available ? "text-meru-secondary" : "text-red-600",
        className
      )}
    >
      {stockAvailabilityLabel(stock)}
    </p>
  );
}
