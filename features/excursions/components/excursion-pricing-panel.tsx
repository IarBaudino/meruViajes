import { formatCurrencyARS } from "@/lib/format";
import type { Service } from "@/types";
import {
  applyDiscountPercent,
  getApplicableDiscountOptions,
  getEffectiveAdultPrice,
  hasActivePromotion,
  hasAnyDiscount,
} from "@/features/excursions/lib/pricing";

type Props = {
  service: Service;
};

export function ExcursionPricingPanel({ service }: Props) {
  const promoActive = hasActivePromotion(service);
  const adultPrice = getEffectiveAdultPrice(service);
  const discountOptions = getApplicableDiscountOptions(service);

  return (
    <div>
      <p className="text-sm text-meru-muted">
        {promoActive ? "Tarifa promocional" : "Tarifa adulto"}
      </p>
      {promoActive ? (
        <div className="mt-1">
          <p className="text-sm text-meru-muted line-through">
            {formatCurrencyARS(service.price)}
          </p>
          <p className="text-3xl font-bold text-meru-primary">
            {formatCurrencyARS(adultPrice)}
          </p>
          {service.promotion?.endsAt ? (
            <p className="mt-1 text-xs text-meru-secondary">
              Hasta {service.promotion.endsAt.split("-").reverse().join("/")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-1 text-3xl font-bold text-meru-primary">
          {formatCurrencyARS(adultPrice)}
        </p>
      )}

      {(hasAnyDiscount(service) || discountOptions.length > 0) && (
        <div className="mt-4 rounded-lg border border-meru-border bg-meru-sand/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-meru-charcoal">
            Tarifas con descuento
          </p>
          <ul className="mt-2 space-y-2">
            <li className="flex items-center justify-between text-sm text-meru-charcoal-muted">
              <span>
                Infantes <span className="text-meru-secondary">gratis</span>
              </span>
              <span className="font-semibold text-meru-charcoal">
                {formatCurrencyARS(0)}
              </span>
            </li>
            {discountOptions.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between text-sm text-meru-charcoal-muted"
              >
                <span>
                  {opt.label}{" "}
                  <span className="text-meru-secondary">−{opt.percent}%</span>
                </span>
                <span className="font-semibold text-meru-charcoal">
                  {formatCurrencyARS(applyDiscountPercent(adultPrice, opt.percent))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-meru-muted">
            Los descuentos se calculan al armar la reserva según el tipo de pasajero.
          </p>
        </div>
      )}
    </div>
  );
}
