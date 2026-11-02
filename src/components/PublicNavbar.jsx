import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/api/authClient";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "About Us", path: "/about" },
  { label: "Contact", path: "/contact" },
];

// The bar is navy on every page so it reads as one brand block with the hero
// and the footer. `solid` only controls whether it gains a shadow immediately
// (dashboards) or waits until the page scrolls (marketing pages).
export default function PublicNavbar({ solid = false }) {
  const [scrolled, setScrolled] = useState(solid);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(solid || window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  useEffect(() => {
    if (authClient.isAuthenticated()) authClient.me().then(setUser).catch(() => authClient.logout());
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isAdmin = user?.role === "admin";
  const isServiceBoy = user?.role === "service_boy";

  // Each role gets exactly one portal button: admins the admin panel, service
  // executives their pickup list, customers their dashboard.
  const portal = isAdmin
    ? { label: "Admin Dashboard", path: "/admin" }
    : isServiceBoy
      ? { label: "My Pickups", path: "/serviceboy" }
      : { label: "My Dashboard", path: "/dashboard" };

  return (
    <header
      className={`fixed top-0 z-50 w-full bg-navy transition-shadow duration-500 ${
        scrolled ? "shadow-lg shadow-navy/25" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="group" aria-label="STAR LAUNDROVAMAT — home">
          <Logo
            markClassName="h-11 w-auto transition-transform duration-500 ease-swift group-hover:scale-110"
            titleClassName="text-white"
            taglineClassName="text-navy-muted"
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                  active ? "text-primary" : "text-white/75 hover:text-white"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle className="border-white/15 bg-white/10 text-white hover:border-primary/50 hover:bg-white/15" />
          {user ? (
            <Button onClick={() => navigate(portal.path)} size="sm">{portal.label}</Button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:text-white"
              >
                Login
              </button>
              <Button size="sm" onClick={() => navigate("/book")}>Book Now</Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle className="border-white/15 bg-white/10 text-white" />
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors duration-300 hover:bg-white/20"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="animate-fade-up border-t border-white/10 bg-navy md:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                  location.pathname === link.path
                    ? "bg-primary text-primary-foreground"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              {user ? (
                <Button onClick={() => navigate(portal.path)} className="flex-1">{portal.label}</Button>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="flex-1 rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Login
                  </button>
                  <Button onClick={() => navigate("/book")} className="flex-1">Book Now</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
