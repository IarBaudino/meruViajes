import type { GroupTrip } from "@/types/catalog";
import { weekdayLabel, formatYmdEs } from "@/features/group-trips/lib/dates";

type Props = {
  days: GroupTrip["itineraryDays"];
};

export function GroupTripItinerary({ days }: Props) {
  if (!days.length) return null;

  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <ol className="space-y-8">
      {sorted.map((day) => {
        const weekday = weekdayLabel(day.date);
        const dateLabel = formatYmdEs(day.date);
        return (
          <li key={day.id} className="border-t border-brand-border pt-8 first:border-0 first:pt-0">
            <p className="text-xs font-medium uppercase tracking-wider text-brand-secondary">
              Día {day.dayNumber}
              {weekday ? ` · ${weekday}` : ""}
              {dateLabel ? ` · ${dateLabel}` : ""}
            </p>
            <h3 className="mt-1 text-xl text-brand-charcoal">{day.title}</h3>
            <div className="mt-5 space-y-5">
              {day.blocks.map((block) => (
                <article
                  key={block.id}
                  className="rounded-xl border border-brand-border bg-white p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg text-brand-charcoal">{block.title}</h4>
                    {block.optional ? (
                      <span className="rounded-full bg-brand-sand px-2 py-0.5 text-xs text-brand-charcoal">
                        Opcional
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-muted">
                    {block.description}
                  </p>
                  {block.whatYouNeed ? (
                    <p className="mt-3 text-sm text-brand-charcoal">
                      <span className="font-medium">Qué necesitás: </span>
                      {block.whatYouNeed}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
