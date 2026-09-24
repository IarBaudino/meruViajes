import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const MERU_LOGO_SRC = "/logo.png";

type BrandLogoProps = {
  /** `null` = sin link */
  href?: string | null;
  className?: string;
  /** sm header compacto · md nav · lg auth · xl hero/auth destacado */
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
  onClick?: () => void;
};

const sizeClass: Record<NonNullable<BrandLogoProps["size"]>, string> = {
  sm: "h-9 w-auto",
  md: "h-11 w-auto sm:h-12",
  lg: "h-20 w-auto",
  xl: "h-28 w-auto sm:h-32",
};

export function BrandLogo({
  href = "/",
  className,
  size = "md",
  priority = false,
  onClick,
}: BrandLogoProps) {
  const image = (
    <Image
      src={MERU_LOGO_SRC}
      alt="Meru Viajes y Turismo"
      width={240}
      height={280}
      className={cn(sizeClass[size], "object-contain object-center", className)}
      priority={priority}
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex shrink-0 items-center"
      aria-label="Meru Viajes y Turismo — Inicio"
    >
      {image}
    </Link>
  );
}
