import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await base44.functions.invoke("sendContactEmail", form);
      toast({ title: "Message sent!", description: "We'll get back to you shortly." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast({ title: "Could not send message", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  const contactInfo = [
    { icon: Phone, label: "Call Us", value: "+91 99999 99999", href: "tel:+919999999999" },
    { icon: Mail, label: "Email Us", value: "care@starlaundrovamat.com", href: "mailto:care@starlaundrovamat.com" },
    { icon: MapPin, label: "Service Area", value: "Available across the city" },
    { icon: Clock, label: "Hours", value: "Mon–Sun, 8am–8pm" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="relative overflow-hidden pt-28 pb-16 lg:pt-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-background to-background" />
          <div className="absolute right-[-5%] top-[15%] h-[400px] w-[400px] rounded-full bg-primary/8 blur-3xl animate-aurora" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</p>
            <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">We'd love to <span className="text-gradient">hear from you</span></h1>
            <p className="mt-4 text-lg text-muted-foreground">Questions, feedback, or special requests — reach out anytime.</p>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <a
                    key={info.label}
                    href={info.href || "#"}
                    className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{info.label}</p>
                    <p className="mt-1 font-heading text-base font-semibold text-foreground">{info.value}</p>
                  </a>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" disabled={sending} className="w-full rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30">
                  {sending ? "Sending..." : <>Send Message <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}