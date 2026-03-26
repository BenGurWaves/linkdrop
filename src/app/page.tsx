import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

const faqItems = [
  {
    question: "How many links can I add?",
    answer: "Unlimited. Add as many links as you need, free or pro.",
  },
  {
    question: "Is it really free?",
    answer:
      "Yes. Free pages include all core features with a small LinkDrop badge. Pro removes the badge and adds analytics, custom domains, and SEO controls.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Custom domains are available on the Pro plan ($5/month). Point your domain and we handle the rest.",
  },
  {
    question: "What happens after 90 days on free?",
    answer:
      "Free pages are live for 90 days. Upgrade to Pro anytime to keep your page live forever.",
  },
  {
    question: "How is this different from Linktree?",
    answer:
      "LinkDrop is designed, not templated. Every page feels intentional — guided setup, organic themes, and no visual clutter. Built for people who care how things look.",
  },
  {
    question: "Do you sell my data?",
    answer: "No. We do not track you, sell your data, or show ads. Ever.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function MarketingHome() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-5 pt-32 pb-20 text-center">
        <h1
          className="text-5xl md:text-6xl leading-tight text-text-primary max-w-2xl animate-in"
          style={{ fontFamily: "var(--font-display)" }}
        >
          your links deserve better than a template
        </h1>
        <p
          className="mt-5 max-w-md text-base text-text-secondary leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          a link-in-bio page that feels designed, not generated. guided setup,
          organic themes, zero clutter.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link href="/login" className="btn btn-dark">
            create your page — free
          </Link>
          <Link href="/pricing" className="btn btn-outline">
            see pricing
          </Link>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="mx-auto w-full max-w-lg px-5 pb-20">
        <div className="card-elevated overflow-hidden rounded-2xl">
          <div
            className="flex flex-col items-center py-10 px-6 gap-4"
            style={{ backgroundColor: "#F5F0EB", color: "#3A3A38" }}
          >
            <div
              className="h-16 w-16 rounded-full"
              style={{
                backgroundColor: "#A8B5A0",
                border: "2px solid #A8B5A0",
              }}
            />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
              Sarah Cole
            </h2>
            <p
              className="text-sm text-center max-w-xs"
              style={{ color: "#7A8370", fontFamily: "var(--font-body)" }}
            >
              photographer + creative director based in Brooklyn
            </p>
            <div className="w-full flex flex-col gap-2.5 mt-2">
              {["portfolio", "instagram", "booking inquiries"].map((label) => (
                <div
                  key={label}
                  className="w-full rounded-xl py-3 text-center text-sm font-medium"
                  style={{
                    backgroundColor: "#A8B5A0",
                    color: "#FFFFFF",
                    fontFamily: "var(--font-ui)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-4xl px-5 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-text-tertiary mb-2">
              guided setup
            </p>
            <h3
              className="text-xl text-text-primary mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              answer a few questions, get a page
            </h3>
            <p
              className="text-sm text-text-secondary leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              paste your links, pick a vibe, publish. no drag-and-drop builders
              or config panels.
            </p>
          </div>
          <div className="card">
            <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-text-tertiary mb-2">
              built-in QR codes
            </p>
            <h3
              className="text-xl text-text-primary mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              share anywhere with Glyph
            </h3>
            <p
              className="text-sm text-text-secondary leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              generate a beautiful QR code for your page in one click. print it,
              share it, stick it on anything.
            </p>
          </div>
          <div className="card">
            <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-text-tertiary mb-2">
              analytics
            </p>
            <h3
              className="text-xl text-text-primary mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              know who clicks
            </h3>
            <p
              className="text-sm text-text-secondary leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              page views, link clicks, countries, devices. clean data, no bloat.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto w-full max-w-3xl px-5 pb-20">
        <h2
          className="text-center text-3xl text-text-primary mb-10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          simple pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card flex flex-col">
            <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-text-tertiary mb-1">
              free
            </p>
            <p
              className="text-4xl text-text-primary mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              $0
            </p>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {[
                "unlimited links",
                "3 organic themes",
                "guided setup",
                "QR code via Glyph",
                "LinkDrop badge",
              ].map((f) => (
                <li
                  key={f}
                  className="text-sm text-text-secondary"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn btn-outline w-full">
              get started
            </Link>
          </div>

          <div className="card-elevated flex flex-col border-terracotta">
            <p className="font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-terracotta mb-1">
              pro
            </p>
            <p
              className="text-4xl text-text-primary mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              $5<span className="text-lg text-text-tertiary">/mo</span>
            </p>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {[
                "everything in free",
                "no badge",
                "custom domain",
                "detailed analytics",
                "SEO controls",
                "link scheduling",
                "priority support",
              ].map((f) => (
                <li
                  key={f}
                  className="text-sm text-text-secondary"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="btn btn-dark w-full">
              go pro
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-2xl px-5 pb-20">
        <h2
          className="text-center text-3xl text-text-primary mb-10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          questions
        </h2>
        <div className="flex flex-col gap-6">
          {faqItems.map((item, i) => (
            <div key={i} className="border-b border-border-light pb-5">
              <h3 className="font-[family-name:var(--font-ui)] text-sm font-medium text-text-primary mb-2">
                {item.question}
              </h3>
              <p
                className="text-sm text-text-secondary leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
