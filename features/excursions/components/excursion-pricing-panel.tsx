import { formatCurrencyARS } from "@/lib/format";
import type { Service } from "@/types";
import { getDiscountLines, hasAnyDiscount } from "@/features/excursions/lib/pricing";

type Props = {
  service: Service;
};

export function ExcursionPricingPanel({ service }: Props) {
  const discountLines = getDiscountLines(service.price, service.discounts);

  return (
    <div>
      <p className="text-sm text-meru-muted">Tarifa adulto</p>
      <p className="mt-1 text-3xl font-bold text-meru-primary">
        {formatCurrencyARS(service.price)}
      </p>

      {hasAnyDiscount(service.discounts) && (
        <div className="mt-4 rounded-lg border border-meru-border bg-meru-sand/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-meru-charcoal">
            Tarifas con descuento
          </p>
          <ul className="mt-2 space-y-2">
            {discountLines.map((line) => (
              <li
                key={line.category}
                className="flex items-center justify-between text-sm text-meru-charcoal-muted"
              >
                <span>
                  {line.label}{" "}
                  <span className="text-meru-secondary">−{line.percent}%</span>
                </span>
                <span className="font-semibold text-meru-charcoal">
                  {formatCurrencyARS(line.price)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-meru-muted">
            Los descuentos se aplican al confirmar la reserva según edad del pasajero.
          </p>
        </div>
      )}
    </div>
  );
}
