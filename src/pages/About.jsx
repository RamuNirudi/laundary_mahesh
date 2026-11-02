import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Clock, Leaf, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import { Image } from "@/components/ui/image";

const ABOUT_IMG = "https://media.base44.com/images/public/6a9d6d727835e768bfcca3bf/8b92abff0_generated_b7f805aa.jpg";

const VALUES = [
  { icon: ShieldCheck, title: "Fabric-Safe Care", desc: "Every garment is treated with the right process for its fabric." },
  { icon: Clock, title: "On-Time Delivery", desc: "We respect your schedule with reliable pickup and delivery." },
  { icon: Leaf, title: "Eco-Conscious", desc: "Biodegradable detergents and water-efficient processes." },
  { icon: Award, title: "Professional Quality", desc: "Trained staff and premium equipment for pristine results." },
];

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="relative overflow-hidden pb-20 pt-32 lg:pt-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
          <div className="absolute left-[-6%] top-[8%] h-[30rem] w-[30rem] animate-aurora rounded-full bg-accent/14 blur-[120px]" />
          <div className="absolute right-[-6%] top-[30%] h-[26rem] w-[26rem] animate-aurora rounded-full bg-primary/12 blur-[120px]" style={{ animationDelay: "-8s" }} />
        </div>
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <p className="eyebrow">About Us</p>
              <h1 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Garment stewardship, <span className="text-gradient">redefined</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                STAR LAUNDROVAMAT was founded on a simple belief: laundry should feel like a premium concierge service, not a chore. We combine professional fabric care with the convenience of doorstep pickup and delivery.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                From everyday wash-and-fold to intricate saree rolling and leather cleaning, our trained team treats every garment with the precision it deserves.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate("/book")}>Book Now <ArrowRight className="h-4 w-4" /></Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/services")}>Our Services</Button>
              </div>
            </div>
            <div className="animate-fade-up stagger-3 relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-brand opacity-20 blur-3xl" />
              <div className="border-gradient relative overflow-hidden rounded-3xl border border-border/60 shadow-2xl">
                <Image src={ABOUT_IMG} alt="Premium fabric care" fittingType="fill" className="aspect-[4/3] w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-accent/20 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/70 bg-secondary/25 py-24">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Our Values</p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl">What we stand for</h2>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className={`surface surface-hover edge-light animate-fade-up stagger-${i + 1} group rounded-2xl p-7`}>
                  <div className="flex items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary transition-all duration-500 ease-swift group-hover:scale-110 group-hover:border-transparent group-hover:bg-gradient-brand group-hover:text-primary-foreground group-hover:shadow-glow" style={{ height: 52, width: 52 }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-heading text-lg font-bold tracking-tight">{v.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="surface edge-light grid gap-10 rounded-3xl px-8 py-12 text-center sm:grid-cols-3">
            {[
              { value: "10K+", label: "Garments cared for" },
              { value: "19", label: "Specialized services" },
              { value: "4.9\u2605", label: "Average rating" },
            ].map((stat, i) => (
              <div key={stat.label} className={`animate-fade-up stagger-${i + 1} sm:border-r sm:border-border/70 sm:last:border-r-0`}>
                <p className="text-gradient font-heading text-5xl font-bold tracking-tight tabular sm:text-6xl">{stat.value}</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}