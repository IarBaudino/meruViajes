import Link from "next/link";

export default function ExcursionNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl text-meru-charcoal">Excursión no encontrada</h1>
      <p className="mt-3 text-meru-muted">
        Es posible que el enlace haya cambiado o que la actividad ya no esté publicada.
      </p>
      <Link
        href="/excursiones"
        className="mt-8 inline-block rounded-lg bg-meru-primary px-6 py-2.5 font-semibold text-white hover:bg-meru-primary-dark"
      >
        Ver excursiones
      </Link>
    </div>
  );
}
