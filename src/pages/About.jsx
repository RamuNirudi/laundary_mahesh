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

      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
          <div className="absolute left-[-5%] top-[10%] h-[400px] w-[400px] rounded-full bg-accent/8 blur-3xl animate-aurora" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">About Us</p>
              <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
                Garment stewardship, <span className="text-gradient">redefined</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                STAR LAUNDROVAMAT was founded on a simple belief: laundry should feel like a premium concierge service, not a chore. We combine professional fabric care with the convenience of doorstep pickup and delivery.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                From everyday wash-and-fold to intricate saree rolling and leather cleaning, our trained team treats every garment with the precision it deserves.
              </p>
              <div className="mt-8 flex gap-3">
                <Button onClick={() => navigate("/book")} className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">Book Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button variant="outline" onClick={() => navigate("/services")} className="rounded-full px-6">Our Services</Button>
              </div>
            </div>
            <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="overflow-hidden rounded-3xl border border-border shadow-xl shadow-primary/10">
                <Image src={ABOUT_IMG} alt="Premium fabric care" fittingType="fill" className="aspect-[4/3] w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Our Values</p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">What we stand for</h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center sm:grid-cols-3">
            <div className="group">
              <p className="font-heading text-5xl font-bold text-gradient">10K+</p>
              <p className="mt-2 text-sm text-muted-foreground">Garments cared for</p>
            </div>
            <div className="group">
              <p className="font-heading text-5xl font-bold text-gradient">19</p>
              <p className="mt-2 text-sm text-muted-foreground">Specialized services</p>
            </div>
            <div className="group">
              <p className="font-heading text-5xl font-bold text-gradient">4.9★</p>
              <p className="mt-2 text-sm text-muted-foreground">Average rating</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}