import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const quickBook = (e) => {
    e.preventDefault();
    navigate("/book");
  };

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border bg-card">
      <div className="absolute right-[-5%] top-[-50%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading text-base font-bold">STAR LAUNDROVAMAT</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Premium Garment Stewardship</p>
              </div>
            </div>
            <p className="!mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Professional laundry and dry cleaning delivered to your doorstep. Premium fabric care with every collection.
            </p>
            <div className="mt-6 space-y-2.5">
              <a href="tel:+919999999999" className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-primary">
                <Phone className="h-4 w-4" /> +91 99999 99999
              </a>
              <a href="mailto:care@starlaundrovamat.com" className="flex items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-primary">
                <Mail className="h-4 w-4" /> care@starlaundrovamat.com
              </a>
              <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> Available across the city
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">Explore</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">Home</Link></li>
              <li><Link to="/services" className="text-sm text-muted-foreground transition-colors hover:text-primary">Services</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground transition-colors hover:text-primary">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">Account</h4>
            <ul className="mt-4 space-y-2.5">
              <li><Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-primary">Login</Link></li>
              <li><Link to="/register" className="text-sm text-muted-foreground transition-colors hover:text-primary">Register</Link></li>
              <li><Link to="/book" className="text-sm text-muted-foreground transition-colors hover:text-primary">Book Now</Link></li>
              <li><Link to="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-primary">My Dashboard</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">Quick Book</h4>
            <p className="mt-4 text-sm text-muted-foreground">Schedule a pickup in under 60 seconds.</p>
            <form onSubmit={quickBook} className="mt-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Button type="submit" className="rounded-full px-5 shadow-md shadow-primary/20">
                Book <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} STAR LAUNDROVAMAT. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link to="/about" className="transition-colors hover:text-primary">Privacy</Link>
            <Link to="/about" className="transition-colors hover:text-primary">Terms</Link>
            <Link to="/contact" className="transition-colors hover:text-primary">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}