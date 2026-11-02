import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { laundryClient } from "@/api/authClient";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";

const CATEGORIES = ["All", "General", "Dry Cleaning", "Wash", "Iron", "Saree", "Home Care", "Specialty"];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    laundryClient.getServices()
      .then((data) => { setServices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = services.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || s.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="relative overflow-hidden pb-14 pt-32 lg:pt-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
          <div className="absolute right-[-6%] top-[8%] h-[30rem] w-[30rem] animate-aurora rounded-full bg-primary/14 blur-[120px]" />
          <div className="absolute left-[-6%] top-[30%] h-[24rem] w-[24rem] animate-aurora rounded-full bg-accent/12 blur-[120px]" style={{ animationDelay: "-9s" }} />
        </div>
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-50" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-up mx-auto max-w-2xl text-center">
            <p className="eyebrow">Our Services</p>
            <h1 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Premium care for <span className="text-gradient">every garment</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">From everyday laundry to specialty saree care — we handle it all with precision.</p>
          </div>

          <div className="animate-fade-up stagger-2 mx-auto mt-12 max-w-md">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-brand opacity-0 blur transition-opacity duration-500 group-focus-within:opacity-30" />
              <Search className="absolute left-5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="relative h-12 w-full rounded-full border border-border bg-card/70 pl-12 pr-5 text-sm outline-none backdrop-blur-md transition-all duration-300 placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="animate-fade-up stagger-3 mt-7 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`chip ${category === cat ? "chip-active" : "chip-idle"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="!mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-2xl border border-border" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface mx-auto max-w-md rounded-2xl px-8 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <p className="mt-5 font-heading text-lg font-bold">No services found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} onBook={() => navigate("/book", { state: { serviceId: s.id } })} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
