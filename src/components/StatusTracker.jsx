import React from "react";
import { Check, AlertTriangle } from "lucide-react";

const STEPS = [
  { key: "Booking Requested", label: "Requested" },
  { key: "Booking Confirmed", label: "Confirmed" },
  { key: "Service Boy Assigned", label: "Assigned" },
  { key: "Clothes Picked Up", label: "Picked Up" },
  { key: "Cleaning in Progress", label: "Cleaning" },
  { key: "Ready for Delivery", label: "Ready" },
  { key: "Delivered", label: "Delivered" },
];

export default function StatusTracker({ status, compact = false }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const isCancelled = status === "Cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3.5 backdrop-blur-sm">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm shadow-destructive/40">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-destructive">Booking Cancelled</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STEPS.map((step, i) => {
          const done = i <= currentIndex;
          const current = i === currentIndex;
          return (
            <React.Fragment key={step.key}>
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <div className="relative">
                  {/* Pulsing halo marks the live step at a glance. */}
                  {current && (
                    <span className="absolute inset-0 animate-ping-ring rounded-full bg-primary/40" />
                  )}
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ease-swift ${
                      done
                        ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                        : "border border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${done ? "text-primary" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 rounded-full transition-colors duration-500 sm:w-10 ${i < currentIndex ? "bg-gradient-brand" : "bg-border"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const current = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="relative">
                {current && <span className="absolute inset-0 animate-ping-ring rounded-full bg-primary/40" />}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ease-swift ${
                    done
                      ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                      : "border border-border bg-secondary text-muted-foreground"
                  } ${current ? "ring-4 ring-primary/20" : ""}`}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-8 w-0.5 rounded-full transition-colors duration-500 ${i < currentIndex ? "bg-gradient-brand" : "bg-border"}`} />
              )}
            </div>
            <div className="pb-2">
              <p className={`text-sm font-semibold transition-colors ${done ? "text-foreground" : "text-muted-foreground"}`}>
                {step.key}
              </p>
              {current && (
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">In progress</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
