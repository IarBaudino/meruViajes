import { Eye, Heart, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const values = [
  {
    icon: Target,
    title: "Nuestra Misión",
    text: "Crear experiencias únicas y memorables en Ushuaia, conectando a los viajeros con la naturaleza y la cultura local de manera sostenible.",
  },
  {
    icon: Eye,
    title: "Nuestra Visión",
    text: "Ser la referencia en turismo aventura en Tierra del Fuego, ofreciendo las mejores excursiones y experiencias para nuestros visitantes.",
  },
  {
    icon: Heart,
    title: "Nuestros Valores",
    text: "Compromiso con la excelencia, respeto por la naturaleza y pasión por brindar experiencias auténticas y seguras.",
  },
];

export function AboutSection() {
  return (
    <section id="sobre-nosotros" className="scroll-mt-24 bg-meru-sand py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-meru-charcoal sm:text-4xl">Sobre Nosotros</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg italic text-meru-charcoal-muted">
            &ldquo;Descubre la magia del Fin del Mundo con nosotros&rdquo;
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="transition-shadow hover:shadow-[var(--shadow-elevated)]">
              <CardContent className="pt-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-meru-ice">
                  <Icon className="h-6 w-6 text-meru-primary" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-meru-charcoal">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-meru-charcoal-muted">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-center leading-relaxed text-meru-charcoal-muted">
          En Turismo Meru, nos dedicamos a hacer realidad tus sueños de aventura en el Fin del
          Mundo. Con años de experiencia y un equipo apasionado, te garantizamos experiencias
          únicas y seguras en los paisajes más impresionantes de Ushuaia y Tierra del Fuego.
        </p>
      </div>
    </section>
  );
}
