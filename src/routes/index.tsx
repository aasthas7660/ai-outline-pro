import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Menu, ArrowRight } from "lucide-react";
import heroIllustration from "@/assets/blogger-hero.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OutlineCraft AI — Publishing platform for professional bloggers" },
      { name: "description", content: "Create beautiful, independent online publications. Generate blog outlines, SEO tools, briefs and more — faster than ever." },
      { property: "og:title", content: "OutlineCraft AI" },
      { property: "og:description", content: "Publishing platform for professional bloggers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { title: "Structured outlines", desc: "H1, H2, H3, intro, conclusion, takeaways and 5 FAQs — every single time." },
  { title: "SEO built-in", desc: "Keywords, intent, meta tags, slugs and SEO score baked into every draft." },
  { title: "Multilingual", desc: "Ship in English, Hindi, Marathi, Spanish, French, German and more." },
  { title: "Briefs & gaps", desc: "Surfer-style content briefs and gap audits against top-ranking pages." },
  { title: "Content calendar", desc: "Plan weeks of publishing in one click and export in any format." },
  { title: "Private by default", desc: "Row-level security on every row. Your outlines are yours." },
];

const faqs = [
  { q: "What kinds of outlines can I generate?", a: "Any long-form blog post: how-tos, listicles, opinion pieces, deep-dives, comparison posts, and more." },
  { q: "Which languages are supported?", a: "English, Hindi, Marathi, Spanish, French, German, Portuguese, Italian, Dutch and Japanese." },
  { q: "Can I edit and reuse outlines?", a: "Yes — every outline is saved to your history. Favorite the best ones and export as Markdown, HTML, TXT or Blogger." },
  { q: "Is my data private?", a: "Yes. Each user only ever sees their own outlines — enforced at the database layer." },
  { q: "Is there a free tier?", a: "Yes, free generations are included while you explore." },
];

function Landing() {
  return (
    <div
      className="min-h-screen"
      style={{
        // Scoped light palette — doesn't touch the dark app shell
        ["--cream" as any]: "#f5efe6",
        ["--cream-2" as any]: "#efe7db",
        ["--ink" as any]: "#22201d",
        ["--ink-2" as any]: "#4a4744",
        ["--coral" as any]: "#e85d4a",
        ["--coral-2" as any]: "#d94a37",
        background: "#2b2825",
        color: "var(--ink)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-4 py-6 md:py-10">
        {/* Rounded card containing the whole page */}
        <div
          className="rounded-[36px] overflow-hidden"
          style={{ background: "var(--cream)" }}
        >
          {/* NAV */}
          <header className="flex items-center justify-between px-6 md:px-14 pt-8 md:pt-10">
            <Link to="/" className="flex items-center gap-2 font-semibold text-[color:var(--ink)]">
              <Menu className="h-5 w-5" strokeWidth={2.5} />
              <span className="font-display text-xl tracking-tight">OutlineCraft</span>
            </Link>
            <nav className="hidden md:flex items-center gap-10 text-[15px] text-[color:var(--ink-2)]">
              <a href="#about" className="hover:text-[color:var(--ink)]">About</a>
              <a href="#features" className="hover:text-[color:var(--ink)]">Features</a>
              <a href="#faq" className="hover:text-[color:var(--ink)]">Resources</a>
            </nav>
            <Link
              to="/auth"
              className="rounded-full border-2 border-[color:var(--ink)] px-5 py-2 text-sm font-medium text-[color:var(--ink)] hover:bg-[color:var(--ink)] hover:text-[color:var(--cream)] transition-colors"
            >
              Try for Free
            </Link>
          </header>

          {/* HERO */}
          <section className="grid gap-8 md:grid-cols-2 items-center px-6 md:px-14 pt-14 md:pt-20 pb-16 md:pb-24">
            <div>
              <h1 className="font-display font-bold text-[color:var(--ink)] leading-[1.02] tracking-tight text-5xl md:text-6xl lg:text-7xl">
                Publishing<br />platform for<br />professional<br />bloggers
              </h1>
              <p className="mt-8 max-w-md text-[17px] leading-relaxed text-[color:var(--ink-2)]">
                Create beautiful, independent online publications by writing faster and better than you ever have before.
              </p>
              <div className="mt-10">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-3 rounded-md px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(232,93,74,0.7)] hover:brightness-105 transition"
                  style={{ background: "var(--coral)" }}
                >
                  Get Started
                  <span className="text-white/80">—</span>
                  <span className="text-white/90 font-normal">it's free</span>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroIllustration}
                alt="Illustration of a blogger writing on a laptop surrounded by creative ideas"
                width={1200}
                height={1024}
                className="w-full h-auto"
              />
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="px-6 md:px-14 py-16 md:py-24 border-t" style={{ borderColor: "rgba(34,32,29,0.08)" }}>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--ink-2)]">Features</p>
              <h2 className="mt-4 font-display font-bold text-4xl md:text-5xl text-[color:var(--ink)] leading-tight">
                Everything you need to publish with confidence
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div key={f.title} className="border-t pt-6" style={{ borderColor: "rgba(34,32,29,0.15)" }}>
                  <div className="text-sm text-[color:var(--ink-2)]">0{i + 1}</div>
                  <h3 className="mt-3 font-display text-xl font-semibold text-[color:var(--ink)]">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--ink-2)]">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ABOUT / HOW */}
          <section id="about" className="px-6 md:px-14 py-16 md:py-24" style={{ background: "var(--cream-2)" }}>
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--ink-2)]">How it works</p>
                <h2 className="mt-4 font-display font-bold text-4xl md:text-5xl text-[color:var(--ink)] leading-tight">
                  From blank page to publish — in three moves.
                </h2>
              </div>
              <div className="space-y-8">
                {[
                  { n: "01", t: "Describe your topic", d: "Add the blog topic, target audience, tone, language and length." },
                  { n: "02", t: "Generate with AI", d: "We draft a complete, SEO-ready outline in seconds." },
                  { n: "03", t: "Save, export, refine", d: "Copy the outline, save it, or regenerate until it's perfect." },
                ].map((s) => (
                  <div key={s.n} className="flex gap-6">
                    <div className="font-display text-3xl text-[color:var(--coral)] font-bold w-14 shrink-0">{s.n}</div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[color:var(--ink)]">{s.t}</h3>
                      <p className="mt-1 text-[15px] text-[color:var(--ink-2)] leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="px-6 md:px-14 py-16 md:py-24">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--ink-2)]">FAQ</p>
              <h2 className="mt-4 font-display font-bold text-4xl md:text-5xl text-[color:var(--ink)] leading-tight">
                Frequently asked questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="mt-10 max-w-3xl">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`f-${i}`} className="border-b" style={{ borderColor: "rgba(34,32,29,0.15)" }}>
                  <AccordionTrigger className="text-left text-[color:var(--ink)] hover:no-underline text-lg font-display font-semibold py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[color:var(--ink-2)] text-[15px] leading-relaxed pb-5">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* CTA */}
          <section className="px-6 md:px-14 pb-20">
            <div
              className="rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
              style={{ background: "var(--ink)" }}
            >
              <div>
                <h2 className="font-display font-bold text-3xl md:text-5xl text-[color:var(--cream)] leading-tight max-w-xl">
                  Ready to publish faster?
                </h2>
                <p className="mt-4 text-[color:var(--cream)]/70 max-w-md">
                  Join writers shipping better blog posts in a fraction of the time.
                </p>
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center gap-3 rounded-md px-6 py-3.5 text-[15px] font-semibold text-white transition hover:brightness-105"
                style={{ background: "var(--coral)" }}
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="px-6 md:px-14 pb-12 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[color:var(--ink-2)]">
            <div>© {new Date().getFullYear()} OutlineCraft AI</div>
            <div className="flex items-center gap-6">
              <a href="#features" className="hover:text-[color:var(--ink)]">Features</a>
              <a href="#about" className="hover:text-[color:var(--ink)]">About</a>
              <a href="#faq" className="hover:text-[color:var(--ink)]">FAQ</a>
              <Link to="/auth" className="hover:text-[color:var(--ink)]">Sign in</Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
