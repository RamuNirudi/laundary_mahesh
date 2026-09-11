import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authClient } from "@/api/authClient";
import { Menu, X, LogOut, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ role, navItems, title, accent, children }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    authClient.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    authClient.logout();
    window.location.href = "/login";
  };

  const isActive = (path) => location.pathname === path || (path !== `/${role}` && location.pathname.startsWith(path));

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-heading text-sm font-bold leading-tight text-foreground">STAR LAUNDROVAMAT</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`}
            >
              <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        {user?.role === "admin" && (
          <Link
            to="/admin"
            className="mb-2 flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Shield className="h-4 w-4" /> Admin Panel
          </Link>
        )}
        <div className="mb-3 px-2">
          <p className="text-sm font-semibold text-foreground truncate">{user?.full_name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:block">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-heading text-sm font-bold">{title}</p>
          <div className="w-9" />
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
