import Nav from "@/components/nav";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — LinkDrop\u2122 by Calyvent",
};

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1 pt-14">
        <article className="max-w-2xl mx-auto px-6 pt-20 pb-16">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-[28px] text-text-primary">cookie policy</h1>
              <p className="font-[family-name:var(--font-ui)] text-[13px] text-text-tertiary mt-2">effective date: march 26, 2026 &middot; last updated: march 26, 2026</p>
            </div>

            <div className="flex flex-col gap-6 font-[family-name:var(--font-body)] text-[14px] text-text-secondary leading-relaxed">
              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">1. what are cookies</h2>
                <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">2. cookies we use</h2>
                <p>LinkDrop&trade; uses only essential cookies required for authentication and session management. We use Supabase authentication cookies to keep you signed in. We do not use advertising, tracking, or third-party marketing cookies.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">3. third-party cookies</h2>
                <p>Our payment processor (Stripe) may set cookies during the checkout process. These are governed by Stripe&rsquo;s own cookie and privacy policies.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">4. managing cookies</h2>
                <p>You can control cookies through your browser settings. Disabling essential cookies may prevent you from signing in or using certain features of the Service.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">5. contact</h2>
                <p>For questions about our cookie practices, contact us at hello@calyvent.com.</p>
              </section>

              <p className="font-[family-name:var(--font-ui)] text-[12px] text-text-tertiary pt-4 border-t border-border-light">&copy; 2026 Calyvent. All rights reserved. LinkDrop&trade; is a trademark of Calyvent.</p>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
