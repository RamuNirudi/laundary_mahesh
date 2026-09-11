import React from "react";
import { Check } from "lucide-react";

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
      <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">!</span>
        <span className="text-sm font-semibold text-destructive">Booking Cancelled</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STEPS.map((step, i) => {
          const done = i <= currentIndex;
          return (
            <React.Fragment key={step.key}>
              <div className={`flex flex-col items-center gap-1 shrink-0`}>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "bg-secondary text-muted-foreground"
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium ${done ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-10 rounded-full ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
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
          <div key={step.key} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"
              } ${current ? "ring-4 ring-primary/20" : ""}`}>
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-0.5 h-8 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />}
            </div>
            <div className="pb-2">
              <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.key}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}