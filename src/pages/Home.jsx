import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Truck, Sparkles, Shirt, PackageCheck, Check, Star, Clock, ShieldCheck, Zap, Leaf, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { laundryClient } from "@/api/authClient";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { Image } from "@/components/ui/image";

const STEPS = [
  { icon: Shirt, title: "Book Service", desc: "Select your laundry services in seconds with our smart booking flow." },
  { icon: Truck, title: "We Pick Up", desc: "Our service boy collects your clothes right from your doorstep." },
  { icon: Sparkles, title: "Cleaning", desc: "Professional cleaning and premium fabric care for every garment." },
  { icon: PackageCheck, title: "Delivery", desc: "Fresh, pressed clothes delivered back to you — on time, every time." },
];

const HERO_IMG = "https://media.base44.com/images/public/6a9d6d727835e768bfcca3bf/af07f0952_generated_6b36d817.jpg";

export default function Home() {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    laundryClient.getServices()
      .then(setServices)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 lg:pt-40 lg:pb-32">
        {/* Animated aurora background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
          <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-aurora" />
          <div className="absolute right-[-5%] top-[20%] h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl animate-aurora" style={{ animationDelay: "5s" }} />
          <div className="absolute left-[30%] bottom-[0%] h-[350px] w-[350px] rounded-full bg-primary/5 blur-3xl animate-aurora" style={{ animationDelay: "10s" }} />
        </div>
        {/* Grid pattern */}
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-50" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Premium Doorstep Laundry Service
              </div>
              <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
                Premium Laundry<br /><span className="text-gradient">at Your Doorstep</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Book your laundry service online and we'll collect your clothes from your home. Professional care, pristine results — delivered.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate("/book")} className="rounded-full px-7 text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] transition-transform">
                  Book Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/services")} className="rounded-full px-7 text-base backdrop-blur-sm">
                  View Services
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 24hr turnaround</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Fabric-safe care</div>
                <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.9 rating</div>
              </div>
            </div>

            <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="relative overflow-hidden rounded-3xl border border-border shadow-2xl shadow-primary/10">
                <Image src={HERO_IMG} alt="Premium laundry care" fittingType="fill" className="aspect-[4/3] w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
              </div>
              {/* Floating glass stat card */}
              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border bg-card/80 p-4 shadow-xl backdrop-blur-xl sm:block animate-float">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading text-lg font-bold text-foreground">10,000+</p>
                    <p className="text-xs text-muted-foreground">Garments cared for</p>
                  </div>
                </div>
              </div>
              {/* Floating glass rating card */}
              <div className="absolute -top-4 -right-4 hidden rounded-2xl! border border-border bg-card/80 p-3 shadow-xl backdrop-blur-xl sm:block animate-float" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm font-bold text-foreground">4.9</p>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Customer rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border bg-secondary/30 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Zap className="h-4 w-4 text-primary" /> Lightning Fast</div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Leaf className="h-4 w-4 text-primary" /> Eco-Friendly</div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Award className="h-4 w-4 text-primary" /> Premium Quality</div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Fabric-Safe</div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">How It Works</p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Four simple steps to <span className="text-gradient">fresh clothes</span></h2>
            <p className="mt-4 text-muted-foreground">From booking to delivery, we've made laundry effortless.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
                  <div className="absolute right-5 top-5 font-heading text-5xl font-bold text-secondary-foreground/20 transition-colors group-hover:text-primary/20">{i + 1}</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 lg:py-28 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Our Services</p>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Care for <span className="text-gradient">every fabric</span></h2>
            </div>
            <Button variant="outline" onClick={() => navigate("/services")} className="rounded-full">
              View All Services <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 8).map((s) => (
              <ServiceCard key={s.id} service={s} onBook={() => navigate("/book", { state: { serviceId: s.id } })} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-2xl shadow-primary/30 sm:px-16">
            {/* Animated background blobs */}
            <div className="absolute inset-0 -z-0 opacity-30">
              <div className="absolute left-1/4 top-0 h-48 w-48 rounded-full bg-white blur-3xl animate-aurora" />
              <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-white blur-3xl animate-aurora" style={{ animationDelay: "7s" }} />
            </div>
            <div className="relative">
              <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">Ready for fresh, pressed clothes?</h2>
              <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">Book a pickup in under 60 seconds. No payment needed online — we'll handle everything.</p>
              <Button size="lg" onClick={() => navigate("/book")} className="mt-8 rounded-full bg-white px-8 text-base text-primary shadow-lg hover:bg-white/90 hover:scale-[1.02] transition-transform">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
