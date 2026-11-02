import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Sparkles, Shirt, WashingMachine, Wind, Flame,
  BedDouble, Building2, Hammer, Gem, Home, SprayCan,
} from "lucide-react";
import { Image } from "@/components/ui/image";

// A service row carries a free-text `icon` and a `category`. Prefer the
// explicit icon when an admin has set one, otherwise fall back to the
// category — so every card gets a meaningful glyph instead of one generic mark.
const ICONS = {
  saree: Shirt,
  wash: WashingMachine,
  "dry cleaning": Wind,
  dryclean: Wind,
  iron: Flame,
  ironing: Flame,
  "home care": BedDouble,
  home: Home,
  office: Building2,
  "post construction": Hammer,
  deep: SprayCan,
  "deep cleaning": SprayCan,
  specialty: Gem,
  general: Sparkles,
};

const iconFor = (service) => {
  const key = (value) => String(value || "").trim().toLowerCase();
  return ICONS[key(service.icon)] || ICONS[key(service.category)] || Sparkles;
};

export default function ServiceCard({ service, onBook }) {
  const Icon = iconFor(service);

  const cta = (
    <>
      Book <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-swift group-hover/btn:translate-x-0.5" />
    </>
  );
  const ctaClass =
    "shine group/btn inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-300 ease-swift hover:shadow-glow";

  return (
    <div className="surface surface-hover group relative flex flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.name}
            fittingType="fill"
            className="h-full w-full transition-transform duration-700 ease-swift group-hover:scale-110"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary to-accent/10">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-accent shadow-sm transition-transform duration-500 ease-swift group-hover:scale-110 group-hover:rotate-6">
              <Icon className="h-9 w-9" strokeWidth={1.6} />
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-accent shadow-sm backdrop-blur-md">
          {service.category}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-lg font-extrabold tracking-tight text-foreground transition-colors duration-300 group-hover:text-accent">
          {service.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {service.description || "Professional care for your garments."}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
          <div>
            {service.price > 0 && (
              <p className="font-heading text-2xl font-extrabold tracking-tight text-accent tabular">
                ₹{service.price}
                <span className="ml-1.5 font-body text-xs font-medium text-muted-foreground">{service.price_unit}</span>
              </p>
            )}
          </div>
          {onBook ? (
            <button onClick={() => onBook(service)} className={ctaClass}>{cta}</button>
          ) : (
            <Link to="/book" state={{ serviceId: service.id }} className={ctaClass}>{cta}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
