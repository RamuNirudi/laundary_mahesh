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

      <section className="relative overflow-hidden pt-28 pb-12 lg:pt-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
          <div className="absolute right-[-5%] top-[10%] h-[400px] w-[400px] rounded-full bg-primary/8 blur-3xl animate-aurora" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Our Services</p>
            <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Premium care for <span className="text-gradient">every garment</span></h1>
            <p className="mt-4 text-lg text-muted-foreground">From everyday laundry to specialty saree care — we handle it all with precision.</p>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services..."
                className="w-full rounded-full border border-border bg-card/80 py-3 pl-11 pr-4 text-sm outline-none backdrop-blur-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
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
                <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-secondary/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">No services found. Try a different search.</div>
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
