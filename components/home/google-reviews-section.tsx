import { Star } from "lucide-react";
import type { GoogleReviewsCache } from "@/types/catalog";

type Props = {
  title: string;
  cache: GoogleReviewsCache | null;
};

export function GoogleReviewsSection({ title, cache }: Props) {
  if (!cache || cache.reviews.length === 0) return null;

  return (
    <section id="reseñas" className="bg-meru-ice/40 py-16 sm:py-20" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 id="reviews-heading" className="text-3xl text-meru-charcoal">
            {title}
          </h2>
          {cache.rating != null ? (
            <p className="mt-3 flex items-center gap-2 text-meru-muted">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden />
              <span>
                {cache.rating.toFixed(1)}
                {cache.userRatingsTotal
                  ? ` · ${cache.userRatingsTotal} reseñas en Google`
                  : " en Google"}
              </span>
            </p>
          ) : null}
        </div>

        <ul className="mt-10 grid list-none gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cache.reviews.map((review, index) => (
            <li
              key={`${review.authorName}-${index}`}
              className="rounded-2xl border border-meru-border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-1" aria-label={`${review.rating} estrellas`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-meru-border"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-meru-charcoal line-clamp-6">
                “{review.text}”
              </p>
              <p className="mt-4 text-sm font-medium text-meru-primary">{review.authorName}</p>
              {review.relativeTime ? (
                <p className="text-xs text-meru-muted">{review.relativeTime}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
