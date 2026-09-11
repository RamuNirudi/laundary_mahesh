import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function ServiceCard({ service, onBook }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {service.image ? (
          <Image
            src={service.image}
            alt={service.name}
            fittingType="fill"
            className="h-full w-full transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <SparkleIcon name={service.icon} />
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm shadow-sm">
          {service.category}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold text-foreground">{service.name}</h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {service.description || "Professional care for your garments."}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            {service.price > 0 && (
              <p className="font-heading text-lg font-bold text-foreground">
                ₹{service.price}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{service.price_unit}</span>
              </p>
            )}
          </div>
          {onBook ? (
            <button
              onClick={() => onBook(service)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:gap-2.5 hover:shadow-lg hover:shadow-primary/30"
            >
              Book <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to="/book"
              state={{ serviceId: service.id }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:gap-2.5 hover:shadow-lg hover:shadow-primary/30"
            >
              Book <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SparkleIcon({ name }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    </svg>
  );
}