import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { Menu, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/PublicNavbar";
import Logo from "@/components/Logo";

// `showPublicNavbar` keeps the site navigation on screen inside the panel, so
// customers do not lose their way back to Home/Services/Contact after opening
// their dashboard. The bar is 4rem tall; the sidebar and content sit below it.
export default function DashboardLayout({ role, navItems, title, accent, showPublicNavbar = false, children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    authClient.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    authClient.logout();
    window.location.href = "/login";
  };

  const isActive = (path) => location.pathname === path || (path !== `/${role}` && location.pathname.startsWith(path));

  const initials = (user?.full_name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const sidebar = (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center gap-3 border-b border-border/70 px-5 py-5">
        <Logo
          tagline={title}
          className="min-w-0 gap-2"
          markClassName="h-9 w-auto"
          titleClassName="whitespace-nowrap text-xs"
          taglineClassName="tracking-[0.16em]"
        />
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300 ease-swift ${
                active
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:translate-x-1 hover:bg-primary/8 hover:text-primary"
              }`}
            >
              {/* Active rail on the left edge — the "you are here" marker. */}
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80" />
              )}
              <Icon
                className={`transition-transform duration-300 ease-swift ${active ? "" : "group-hover:scale-110"}`}
                style={{ width: 18, height: 18 }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-border/70 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user?.full_name || "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient depth behind the whole panel. */}
      <div className="pointer-events-none fixed inset-0 bg-dots opacity-[0.35]" />
      <div className="pointer-events-none fixed right-[-10%] top-[-10%] h-[34rem] w-[34rem] animate-aurora rounded-full bg-primary/10 blur-[120px]" />

      {showPublicNavbar && <PublicNavbar solid />}

      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 z-40 hidden w-64 border-r border-border/70 bg-card/70 backdrop-blur-xl lg:block ${
          showPublicNavbar ? "top-16 h-[calc(100vh-4rem)]" : "top-0 h-screen"
        }`}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-background/70 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
          <aside className="animate-fade-up absolute left-0 top-0 h-full w-72 border-r border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className={`relative lg:pl-64 ${showPublicNavbar ? "pt-16" : ""}`}>
        {/* Mobile top bar */}
        <header
          className={`sticky z-30 flex items-center justify-between border-b border-border/70 glass px-4 py-3 lg:hidden ${
            showPublicNavbar ? "top-16" : "top-0"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 transition-all duration-300 hover:border-primary/40 hover:text-primary"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-heading text-sm font-bold">{title}</p>
          <div className="w-10" />
        </header>

        <main className="animate-fade-up p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
