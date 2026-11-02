import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { laundryClient } from "@/api/authClient";
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
      await laundryClient.sendContactMessage(form);
      toast({ title: "Message sent!", description: "We'll get back to you shortly." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast({ title: "Could not send message", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  const contactInfo = [
    { icon: Phone, label: "Call Us", value: "+91 86396 67975", href: "tel:+91 86396 67975" },
    { icon: Mail, label: "Email Us", value: "starlaundrovamat@gmail.com", href: "mailto:starlaundrovamat@gmail.com" },
    { icon: MapPin, label: "Service Area", value: "Available across the city" },
    { icon: Clock, label: "Hours", value: "Mon–Sun, 8am–8pm" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <section className="relative overflow-hidden pb-20 pt-32 lg:pt-40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
          <div className="absolute right-[-6%] top-[10%] h-[30rem] w-[30rem] animate-aurora rounded-full bg-primary/14 blur-[120px]" />
          <div className="absolute left-[-6%] bottom-[10%] h-[26rem] w-[26rem] animate-aurora rounded-full bg-accent/12 blur-[120px]" style={{ animationDelay: "-8s" }} />
        </div>
        <div className="absolute inset-0 -z-10 bg-grid bg-grid-fade opacity-50" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-up mx-auto max-w-2xl text-center">
            <p className="eyebrow">Contact</p>
            <h1 className="mt-4 text-balance font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              We'd love to <span className="text-gradient">hear from you</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">Questions, feedback, or special requests — reach out anytime.</p>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            <div className="grid gap-5 sm:grid-cols-2">
              {contactInfo.map((info, i) => {
                const Icon = info.icon;
                return (
                  <a
                    key={info.label}
                    href={info.href || "#"}
                    className={`surface surface-hover edge-light animate-fade-up stagger-${i + 1} group rounded-2xl p-6`}
                  >
                    <div className="flex items-center justify-center rounded-xl border border-primary/20 bg-primary/8 text-primary transition-all duration-500 ease-swift group-hover:scale-110 group-hover:border-transparent group-hover:bg-gradient-brand group-hover:text-primary-foreground group-hover:shadow-glow" style={{ height: 44, width: 44 }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{info.label}</p>
                    <p className="mt-1.5 font-heading text-base font-bold tracking-tight text-foreground">{info.value}</p>
                  </a>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="surface edge-light animate-fade-up stagger-3 rounded-2xl p-6 sm:p-8">
              <h2 className="font-heading text-xl font-bold tracking-tight">Send us a message</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">We usually reply within a few hours.</p>

              <div className="mt-7 space-y-5">
                <div>
                  <label className="field-label">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="field mt-2"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="field mt-2"
                    />
                  </div>
                  <div>
                    <label className="field-label">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="Optional"
                      className="field mt-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="How can we help?"
                    className="field-area mt-2"
                  />
                </div>
                <Button type="submit" size="lg" disabled={sending} className="w-full">
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <>Send Message <Send className="h-4 w-4" /></>
                  )}
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
