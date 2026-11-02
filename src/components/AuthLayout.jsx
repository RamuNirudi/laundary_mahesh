import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

/**
 * Shared shell for every auth screen (login, register, password reset, profile
 * completion).
 *
 * The page is pinned to the viewport height and does not scroll: the spacing is
 * tuned so the tallest screen (register, with three fields) fits inside a
 * ~700px viewport. The inner column keeps `overflow-y-auto` purely as a safety
 * valve — on a genuinely tiny viewport (landscape phone, 400px tall) content
 * stays reachable instead of being clipped off the bottom.
 */
export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="relative h-[100dvh] overflow-hidden">
      {/* Background photograph, dimmed under a navy wash so the white card and
          the headline above it both keep their contrast. */}
      <img
        src="/auth-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-navy/85" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, hsl(var(--primary) / 0.22), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade opacity-[0.08]" />

      <div className="relative flex h-full items-center justify-center px-4 py-5">
        <div className="max-h-full w-full max-w-md overflow-y-auto overscroll-contain">
          <Link to="/" className="group mx-auto mb-5 hidden w-fit tall:block" aria-label="STAR LAUNDROVAMAT — home">
            <Logo
              tagline={null}
              markClassName="h-9 w-auto transition-transform duration-500 ease-swift group-hover:scale-110"
              titleClassName="text-sm text-white"
            />
          </Link>

          <div className="animate-fade-in text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-navy-muted">{subtitle}</p>}
          </div>

          <div className="surface animate-fade-in stagger-2 mt-5 rounded-2xl p-6 shadow-2xl sm:p-7">
            {children}
          </div>

          {footer && (
            <p className="animate-fade-in stagger-3 mt-4 text-center text-sm text-navy-muted">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
