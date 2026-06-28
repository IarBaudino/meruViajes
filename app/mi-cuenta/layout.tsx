import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-meru-sand">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <nav className="mb-8 flex flex-wrap gap-4 text-sm font-medium">
            <Link
              href="/mi-cuenta/perfil"
              className="text-meru-charcoal hover:text-meru-secondary"
            >
              Perfil
            </Link>
            <Link
              href="/mi-cuenta/carrito"
              className="text-meru-charcoal hover:text-meru-secondary"
            >
              Carrito
            </Link>
          </nav>
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}
