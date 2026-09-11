import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/api/authClient";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "About Us", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (authClient.isAuthenticated()) authClient.me().then(setUser).catch(() => authClient.logout());
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const goDashboard = () => {
    if (!user) { navigate("/login"); return; }
    navigate("/dashboard");
  };

  const goAdmin = () => {
    if (user?.role === "admin") { navigate("/admin"); return; }
    navigate(user ? "/dashboard" : "/login?returnTo=/admin");
  };

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? "glass border-b border-border shadow-sm shadow-primary/5" : "bg-transparent"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2.!5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-none">
            <p className="font-heading text-sm font-bold tracking-tight text-foreground">STAR LAUNDROVAMAT</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Premium Garment Care</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.path ? "text-primary" : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {link.label}
              {location.pathname === link.path && (
                <span className="absolute inset-x-3 -bottom-0.5 h-0.!5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={goAdmin} className="rounded-full">Admin</Button>
              <Button onClick={goDashboard} size="sm" className="rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30">My Dashboard</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="rounded-full">Login</Button>
              <Button size="sm" onClick={() => navigate("/book")} className="rounded-full shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30">Book Now</Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button className="rounded-lg p-2 hover:bg-secondary" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-card/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.path} to={link.path} className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${location.pathname === link.path ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-secondary"}`}>
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <>
                  <Button variant="outline" onClick={goAdmin} className="flex-1 rounded-full">Admin</Button>
                  <Button onClick={goDashboard} className="flex-1 rounded-full">Dashboard</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/login")} className="flex-1 rounded-full">Login</Button>
                  <Button onClick={() => navigate("/book")} className="flex-1 rounded-full">Book Now</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
