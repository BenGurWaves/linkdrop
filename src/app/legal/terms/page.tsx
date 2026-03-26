import Nav from "@/components/nav";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — LinkDrop\u2122 by Calyvent",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1 pt-14">
        <article className="max-w-2xl mx-auto px-6 pt-20 pb-16">
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-[28px] text-text-primary">terms & conditions</h1>
              <p className="font-[family-name:var(--font-ui)] text-[13px] text-text-tertiary mt-2">effective date: march 26, 2026 &middot; last updated: march 26, 2026</p>
            </div>

            <div className="flex flex-col gap-6 font-[family-name:var(--font-body)] text-[14px] text-text-secondary leading-relaxed">
              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">1. acceptance of terms</h2>
                <p>By accessing and using LinkDrop&trade; at linkdrop.calyvent.com (the &ldquo;Service&rdquo;), you agree to be bound by these Terms and Conditions. LinkDrop is a product of Calyvent. If you do not agree, do not use the Service.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">2. description of service</h2>
                <p>LinkDrop is a link-in-bio platform that allows users to create, customize, and publish personal link pages. The Service offers a free tier with core features and a paid subscription (&ldquo;Pro&rdquo;) with additional capabilities including custom domains, analytics, SEO controls, and badge removal.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">3. accounts</h2>
                <p>To create a link page, you must register with a valid email address and password. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">4. free tier</h2>
                <p>Free pages include unlimited links, three organic themes, guided setup, and a LinkDrop badge. Free pages are active for 90 days from creation. Calyvent reserves the right to modify free-tier limits at any time.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">5. pro subscription</h2>
                <p>The Pro subscription is billed monthly at $5.00 USD. Alternative payment methods may be available. Subscriptions auto-renew until cancelled. No refunds are issued for partial billing periods.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">6. intellectual property</h2>
                <p>LinkDrop&trade; is a trademark of Calyvent. All content on this Service is the property of Calyvent or its licensors and is protected by applicable intellectual property laws. Content you create using the Service remains yours.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">7. acceptable use</h2>
                <p>You agree not to use the Service to publish illegal, harmful, or malicious content, distribute malware or phishing links, or attempt to gain unauthorized access to the Service or its systems.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">8. limitation of liability</h2>
                <p>The Service is provided &ldquo;as is&rdquo; without warranties of any kind. Calyvent shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability shall not exceed the amount paid by you in the twelve months preceding the claim.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">9. changes to terms</h2>
                <p>Calyvent reserves the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use of the Service constitutes acceptance of the revised Terms.</p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-ui)] text-[13px] font-medium text-text-primary uppercase tracking-[0.1em] mb-3">10. contact</h2>
                <p>For questions about these Terms, contact us at hello@calyvent.com.</p>
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
