import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Truck, Sparkles, Shirt, PackageCheck, Star, ShieldCheck, Zap, Leaf, Award, Play } from "lucide-react";
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

const TRUST = [
  { icon: Zap, label: "Lightning Fast" },
  { icon: Leaf, label: "Eco-Friendly" },
  { icon: Award, label: "Premium Quality" },
  { icon: ShieldCheck, label: "Fabric-Safe" },
];

const HERO_IMG = "https://media.base44.com/images/public/6a9d6d727835e768bfcca3bf/af07f0952_generated_6b36d817.jpg";

/* Social-proof stack. Initials rather than stock faces: no third-party image
   service to depend on, and nothing that reads as a named real customer. */
const AVATARS = [
  { initials: "PS", tone: "bg-primary text-primary-foreground" },
  { initials: "RK", tone: "bg-white text-navy" },
  { initials: "AM", tone: "bg-accent text-white" },
  { initials: "SV", tone: "bg-white text-navy" },
  { initials: "NJ", tone: "bg-primary text-primary-foreground" },
];

/** Small caps label that opens every section. */
const Eyebrow = ({ children }) => (
  <p className="eyebrow">{children}</p>
);

export default function Home() {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    laundryClient.getServices()
      .then(setServices)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <PublicNavbar />

      {/* ---------------------------------------------------------------- Hero */}
      {/* One continuous navy block with the header, so the brand reads as a
          single slab before the page opens out into white. */}
      <section className="relative overflow-hidden bg-navy pb-20 pt-28 lg:pb-28 lg:pt-36">
        <div className="pointer-events-none absolute -left-24 top-10 h-[26rem] w-[26rem] animate-aurora rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-[22rem] w-[22rem] animate-aurora rounded-full bg-primary/8 blur-[120px]" style={{ animationDelay: "-9s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="animate-fade-up">
              <p className="text-sm font-bold tracking-tight text-primary">Professional Cleaning</p>

              <h1 className="mt-5 text-balance font-heading text-5xl font-extrabold leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
                We Clean,
                <br />
                <span className="text-primary">You Relax!</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-relaxed text-navy-muted">
                Experience a spotless environment with our professional cleaning services.
                We deliver exceptional results for homes and businesses.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => navigate("/book")}>
                  Book Cleaning <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => navigate("/services")}
                  className="group inline-flex items-center gap-3 text-sm font-bold text-white"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-all duration-300 ease-swift group-hover:border-primary group-hover:bg-primary">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                  Watch Video
                </button>
              </div>

              {/* Social proof: avatar stack + rating */}
              <div className="mt-10 flex flex-wrap items-center gap-5">
                <div className="flex -space-x-3">
                  {AVATARS.map((avatar, i) => (
                    <span
                      key={avatar.initials}
                      aria-hidden="true"
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-navy text-xs font-extrabold ${avatar.tone}`}
                      style={{ zIndex: AVATARS.length - i }}
                    >
                      {avatar.initials}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <Star className="h-4 w-4 fill-warning text-warning" /> 5.0
                    <span className="font-medium text-navy-muted">(1.2k Reviews)</span>
                  </p>
                  <p className="mt-1 text-sm text-navy-muted">Trusted by 5,000+ Customers</p>
                </div>
              </div>
            </div>

            <div className="animate-fade-up stagger-3 relative">
              {/* Green form sitting behind and offset, so it reads as a
                  crescent along the right and bottom edges of the photo. */}
              <div className="blob-frame absolute inset-0 translate-x-4 translate-y-4 bg-primary" />
              <div className="blob-frame relative">
                <Image src={HERO_IMG} alt="Professional cleaning" fittingType="fill" className="aspect-[4/5] w-full sm:aspect-square" />
              </div>

              {/* Floating stat badges */}
              <div className="animate-float absolute -left-3 bottom-28 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-xl sm:left-0">
                <p className="font-heading text-2xl font-extrabold leading-none">10+</p>
                <p className="mt-1.5 text-xs font-semibold leading-tight opacity-90">Years of<br />Experience</p>
              </div>

              <div className="animate-float absolute -left-3 bottom-2 rounded-2xl bg-white px-5 py-4 text-navy shadow-xl sm:left-0" style={{ animationDelay: "-3s" }}>
                <p className="font-heading text-2xl font-extrabold leading-none">100%</p>
                <p className="mt-1.5 text-xs font-semibold leading-tight text-muted-foreground">Satisfaction<br />Guarantee</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Trust bar */}
      <section className="relative border-y border-border/70 bg-card/40 py-7 backdrop-blur-xl">
        <div className="thread-line absolute inset-x-0 top-0 h-px" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-14 gap-y-4 px-4 sm:px-6 lg:px-8">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="group flex items-center gap-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <Icon className="h-4 w-4 text-primary transition-transform duration-300 ease-swift group-hover:scale-125" />
              {label}
            </div>
          ))}
        </div>
        <div className="thread-line absolute inset-x-0 bottom-0 h-px" />
      </section>

      {/* -------------------------------------------------------- How It Works */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Four simple steps to <span className="text-gradient">fresh clothes</span>
            </h2>
            <p className="mt-5 text-muted-foreground">From booking to delivery, we've made laundry effortless.</p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`surface surface-hover edge-light animate-fade-up stagger-${i + 1} group relative overflow-hidden rounded-2xl p-7`}
                >
                  <div className="absolute right-5 top-4 font-heading text-6xl font-bold text-foreground/5 transition-colors duration-500 group-hover:text-primary/15">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="relative flex items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary transition-all duration-500 ease-swift group-hover:scale-110 group-hover:border-transparent group-hover:bg-gradient-brand group-hover:text-primary-foreground group-hover:shadow-glow" style={{ height: 52, width: 52 }}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-heading text-lg font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- Services preview */}
      <section className="relative border-y border-border/70 bg-secondary/25 py-24 lg:py-32">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <Eyebrow>Our Services</Eyebrow>
              <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Care for <span className="text-gradient">every fabric</span>
              </h2>
            </div>
            <Button variant="outline" onClick={() => navigate("/services")}>
              View All Services <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.slice(0, 8).map((s) => (
              <ServiceCard key={s.id} service={s} onBook={() => navigate("/book", { state: { serviceId: s.id } })} />
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-brand bg-[length:200%_200%] px-8 py-20 text-center shadow-glow-lg animate-gradient sm:px-16">
            <div className="absolute inset-0 opacity-25">
              <div className="absolute left-1/4 top-0 h-56 w-56 animate-aurora rounded-full bg-white blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-56 w-56 animate-aurora rounded-full bg-white blur-3xl" style={{ animationDelay: "-9s" }} />
            </div>
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgb(255 255 255 / 0.4) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.4) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent 75%)",
                WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent 75%)",
              }}
            />
            <div className="relative">
              <h2 className="text-balance font-heading text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
                Ready for fresh, pressed clothes?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-primary-foreground/85">
                Book a pickup in under 60 seconds. No payment needed online — we'll handle everything.
              </p>
              <Button
                size="lg"
                onClick={() => navigate("/book")}
                style={{ backgroundImage: "none" }}
                className="shine mt-10 bg-card text-foreground shadow-xl hover:bg-card hover:shadow-2xl"
              >
                Book Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
