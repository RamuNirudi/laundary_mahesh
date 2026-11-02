import React from "react";
import { cn } from "@/lib/utils";

/**
 * The brand lockup, in one place so the header, sidebar, footer and auth pages
 * cannot drift apart.
 *
 * The supplied artwork is a square emblem with the wordmark baked in underneath.
 * At header size that baked-in text would be a few unreadable pixels, so the
 * default lockup pairs the cropped emblem (`/logo-mark.png`) with live HTML
 * text — crisp at any size, selectable, and translatable. Pass `full` to use
 * the complete artwork instead, where there is room for it to breathe.
 */
export default function Logo({
  full = false,
  tagline = "Premium Garment Care",
  showText = true,
  className = "",
  markClassName = "",
  titleClassName = "",
  taglineClassName = "",
}) {
  if (full) {
    return (
      <img
        src="/logo.png"
        alt="STAR LAUNDROVAMAT"
        width={512}
        height={512}
        className={cn("h-auto w-auto object-contain", className)}
      />
    );
  }

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={256}
        height={170}
        className={cn("h-10 w-auto shrink-0 object-contain", markClassName)}
      />
      {showText && (
        <span className="leading-none">
          <span className={cn("block font-heading text-base font-extrabold tracking-tight", titleClassName)}>
            STAR LAUNDROVAMAT
          </span>
          {tagline && (
            <span
              className={cn(
                "mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground",
                taglineClassName,
              )}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
