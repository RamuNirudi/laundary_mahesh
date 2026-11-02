import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const EXPLORE = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/services" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const ACCOUNT = [
  { label: "Login", to: "/login" },
  { label: "Register", to: "/register" },
  { label: "Book Now", to: "/book" },
  { label: "My Dashboard", to: "/dashboard" },
];

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="group inline-flex items-center gap-1.5 text-sm text-navy-muted transition-all duration-300 hover:text-primary"
  >
    <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
    {children}
  </Link>
);

export default function Footer() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const quickBook = (e) => {
    e.preventDefault();
    navigate("/book");
  };

  return (
    <footer className="relative mt-24 overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute right-[-8%] top-[-40%] h-[30rem] w-[30rem] animate-aurora rounded-full bg-primary/12 blur-[110px]" />
      <div
        className="pointer-events-none absolute left-[-8%] bottom-[-50%] h-[26rem] w-[26rem] animate-aurora rounded-full bg-primary/8 blur-[110px]"
        style={{ animationDelay: "-10s" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo
              tagline="Premium Garment Stewardship"
              markClassName="h-12 w-auto"
              titleClassName="text-white"
              taglineClassName="text-navy-muted"
            />
            <p className="!mt-5 max-w-xs text-sm leading-relaxed text-navy-muted">
              Professional laundry and dry cleaning delivered to your doorstep. Premium fabric care with every collection.
            </p>
            <div className="mt-7 space-y-3">
              <a href="tel:+919999999999" className="group flex items-center gap-3 text-sm text-navy-muted transition-colors hover:text-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                +91 86396 67975
              </a>
              <a href="mailto:care@starlaundrovamat.com" className="group flex items-center gap-3 text-sm text-navy-muted transition-colors hover:text-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                starlaundrovamat@gmail.com
              </a>
              <div className="mt-4 flex items-start gap-3 text-sm text-navy-muted">
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
    <MapPin className="h-4 w-4" />
  </span>

  <div className="flex flex-1 flex-row gap-11">
    <p className="flex-1 ">
      H.NO 8-4/C, Street No. 8, Ravindra Nagar Colony,
      Saraswathi Nagar, Habsiguda, Hyderabad, Telangana 500013
    </p>

    <p className="flex-1">
      House No. 8-6-8/2 Road No. 2, Post,
      Chintalkunta, Telangana 500074
    </p>

    <p className="flex-1">
      9H72+96 Jaya Apartment, 11-13-1044,
      Arunodayanagar Rd No. 1, Margadarshi Colony,
      Kothapet, Hyderabad, Telangana 500102
    </p>
    <p className="flex-1">
      opposite to gully cricket, near Pochamma Temple Lane, Pochammabasti, Krishna Vihar, Sharada Nagar, Kothapet, Hyderabad, Telangana 500035
    </p>
    <p className="flex-1">
      Rd Number 19, opposite to Ganesh Nagar, Cooperative Bank Colony, Nagole, Hyderabad, Telangana 500068
Map of Knots and Threads Designer Studio (Boutique)
    </p>
    <p className="flex-1">
     Satyanarayanapuram Colony, Prabhat Nagar Colony, Kothapet, Hyderabad, Telangana 500060 (Dreams boutique)
    </p>
    <p className="flex-1">
     Street no 2, Akshvani Nagar Colony, Mallikarjuna Nagar, Jahangir Nagar Colony, Hyderabad, Telangana 500074 
Arna reddy  desinger studio
    </p>
  </div>
</div>
              {/* <p className="flex items-center gap-3 text-sm text-navy-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <MapPin className="h-4.5 w-4.5" />
                </span>
                H.NO 8-4/C, Street No. 8, Ravindra Nagar Colony, Saraswathi Nagar, Habsiguda, Hyderabad, Telangana 500013
              </p>
              <p className="flex items-center gap-3 text-sm text-navy-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                House No.8-6-8/2 Road No.2, Post, Chintalkunta, Telangana 500074
              </p>
              <p className="flex items-center gap-3 text-sm text-navy-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                9H72+96 Jaya Apartment, 11-13-1044, Arunodayanagar Rd No.1, Margadarshi Colony, Kothapet, Hyderabad, Telangana 500102
              </p> */}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-heading text-sm font-extrabold text-white">Quick Links</h4>
            <ul className="mt-5 space-y-3">
              {EXPLORE.map((link) => (
                <li key={link.label}><FooterLink to={link.to}>{link.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-heading text-sm font-extrabold text-white">Account</h4>
            <ul className="mt-5 space-y-3">
              {ACCOUNT.map((link) => (
                <li key={link.label}><FooterLink to={link.to}>{link.label}</FooterLink></li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/12 bg-white/5 p-6">
              <h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">Quick Book</h4>
              <p className="mt-3 font-heading text-lg font-extrabold tracking-tight text-white">Schedule a pickup in under 60 seconds.</p>
              <form onSubmit={quickBook} className="mt-5 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="h-11 flex-1 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white outline-none transition-all duration-300 placeholder:text-navy-muted focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
                <Button type="submit">
                  Book <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/12 pt-7 sm:flex-row">
          <p className="text-xs text-navy-muted">
            © {new Date().getFullYear()} STAR LAUNDROVAMAT — All rights reserved.
          </p>
          <div className="flex gap-7 text-xs text-navy-muted">
            <Link to="/about" className="transition-colors hover:text-primary">Privacy</Link>
            <Link to="/about" className="transition-colors hover:text-primary">Terms</Link>
            <Link to="/contact" className="transition-colors hover:text-primary">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
