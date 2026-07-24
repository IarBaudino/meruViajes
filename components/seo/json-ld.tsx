type Props = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** JSON-LD para SEO (Schema.org). */
export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
