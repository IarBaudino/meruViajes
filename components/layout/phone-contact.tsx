"use client";

import { Phone } from "lucide-react";
import { formatPhoneHref } from "@/config/brand";

type Props = {
  phoneLabel: string;
  phoneNumber?: string;
  className?: string;
};

/** Link tel: + WhatsApp si hay número; si no, solo texto. */
export function PhoneContact({ phoneLabel, phoneNumber, className }: Props) {
  const digits = (phoneNumber ?? "").replace(/\D/g, "") || phoneLabel.replace(/\D/g, "");
  const hasNumber = digits.length >= 8;

  if (!hasNumber) {
    return (
      <span className={className}>
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {phoneLabel}
      </span>
    );
  }

  const { tel: telHref, whatsapp: waHref } = formatPhoneHref(digits);

  return (
    <span className={className ?? "inline-flex flex-col gap-1"}>
      <a href={telHref} className="inline-flex items-center gap-2 hover:text-brand-secondary">
        <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {phoneLabel}
      </a>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-brand-muted hover:text-brand-charcoal"
      >
        WhatsApp
      </a>
    </span>
  );
}
