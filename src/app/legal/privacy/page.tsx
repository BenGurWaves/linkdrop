import Nav from "@/components/nav";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LinkDrop\u2122 by Calyvent",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1 pt-14">
        <article className="max-w-2xl mx-auto px-6 pt-20 pb-16">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-[28px] text-text-primary">privacy policy</h1>
              <p className="font-[family-name:var(--font-ui)] text-[13px] text-text-tertiary mt-2">effective date: march 26, 2026 &middot; last updated: march 26, 2026</p>
            </div>

            <div className="flex flex-col gap-6 font-[family-name:var(--font-body)] text-[14px] text-text-secondary leading-relaxed">
              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">1. information we collect</h2>
                <p>We collect your email address and password when you create an account. When visitors view your link page, we collect approximate location (country/city), device type, browser, and referrer for analytics purposes.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">2. how we use your information</h2>
                <p>We use your information to operate the Service, provide analytics to Pro users, process payments, and communicate important updates about your account.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">3. data sharing</h2>
                <p>We do not sell, rent, or share your personal information with third parties for marketing purposes. We may share data with service providers (Supabase for hosting, Stripe for payments) strictly to operate the Service.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">4. data retention</h2>
                <p>Account data is retained as long as your account is active. Analytics data is retained for the duration of your subscription. You may request deletion of your account and associated data at any time by contacting us.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">5. security</h2>
                <p>We implement industry-standard security measures to protect your data. Passwords are hashed and never stored in plain text. All data is transmitted over encrypted connections.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">6. your rights</h2>
                <p>You have the right to access, correct, or delete your personal data. You may export your data or request account deletion by contacting hello@calyvent.com.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">7. changes to this policy</h2>
                <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">8. contact</h2>
                <p>For privacy-related questions, contact us at hello@calyvent.com.</p>
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
