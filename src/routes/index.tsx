import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Wand2, Languages, Target, ListChecks, FileText, ArrowRight, Zap, Globe2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OutlineCraft AI — Generate Blog Outlines with AI" },
      { name: "description", content: "Generate well-structured blog outlines with AI. H1, H2, H3, intros, FAQs, and key takeaways in any tone, language, and length." },
      { property: "og:title", content: "OutlineCraft AI" },
      { property: "og:description", content: "AI-powered blog outline generator built for serious content creators." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Wand2, title: "Structured outputs", desc: "H1, H2, H3, intro, conclusion, takeaways, related topics, and 5 FAQs — every time." },
  { icon: Languages, title: "Multilingual", desc: "Generate in English, Spanish, French, German, Portuguese, Japanese and more." },
  { icon: Target, title: "Audience-tuned", desc: "Pick tone, audience, and length so every outline matches your brand voice." },
  { icon: ListChecks, title: "Save & favorite", desc: "Keep a searchable history. Star the ones worth turning into full posts." },
  { icon: Zap, title: "Lightning fast", desc: "Get a complete outline in seconds. Regenerate with one click." },
  { icon: ShieldCheck, title: "Private by default", desc: "Your outlines are yours. Row-level security on every row." },
];

const steps = [
  { n: "01", title: "Describe your topic", desc: "Add the blog topic, target audience, tone, language, and length." },
  { n: "02", title: "Generate with AI", desc: "Our AI drafts a complete, SEO-ready outline in seconds." },
  { n: "03", title: "Save, copy, or refine", desc: "Copy the outline, save it, or regenerate until it's perfect." },
];

const faqs = [
  { q: "What kinds of outlines can I generate?", a: "Any long-form blog post: how-tos, listicles, opinion pieces, deep-dives, comparison posts, and more." },
  { q: "Which languages are supported?", a: "English, Spanish, French, German, Portuguese, Italian, Dutch, Hindi, and Japanese out of the box." },
  { q: "Can I edit and reuse outlines?", a: "Yes — every outline is saved to your history. Favorite the best ones and copy them as Markdown." },
  { q: "Is my data private?", a: "Yes. Each user only ever sees their own outlines — enforced at the database layer." },
  { q: "Is there a free tier?", a: "Yes, free generations are included while you explore. Upgrade for unlimited use." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-semibold">OutlineCraft AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/auth">Log in</Link></Button>
            <Button asChild><Link to="/auth">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> Powered by Lovable AI
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
            Beautiful blog outlines, <br />
            <span className="gradient-text">generated in seconds.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Stop staring at the blank page. Describe your topic — we deliver a complete H1/H2/H3 structure with intro, FAQs, takeaways, and related ideas.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="shadow-[var(--shadow-elegant)]">
              <Link to="/auth">Start generating <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-display text-4xl font-semibold">Everything you need to ship better content</h2>
          <p className="mt-3 text-muted-foreground">Designed for content marketers, technical writers, and indie bloggers.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="surface-card transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
              <CardContent className="p-6">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <h2 className="font-display text-4xl font-semibold">From idea to outline in three steps</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="surface-card rounded-xl p-6">
                <p className="font-display text-3xl gradient-text">{s.n}</p>
                <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center">
          <h2 className="font-display text-4xl font-semibold">Frequently asked questions</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="surface-card rounded-2xl p-12 text-center" style={{ background: "var(--gradient-primary)" }}>
          <h2 className="font-display text-4xl font-semibold text-primary-foreground">Ready to publish faster?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Join writers shipping better blog posts in a fraction of the time.</p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Create your first outline <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4" />
            <span>© {new Date().getFullYear()} OutlineCraft AI</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
