"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AuthNav from "@/components/auth-nav";
import Footer from "@/components/footer";
import Link from "next/link";

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setEmail(authData.user.email ?? "");
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", authData.user.id)
          .eq("plan", "pro")
          .limit(1)
          .single();
        setIsPro(!!sub);
      }
      setCheckingAuth(false);
    }
    check();
  }, []);

  async function handleStripeCheckout() {
    if (!email) {
      setError("enter your email to continue");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, coupon: coupon || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "checkout failed");
        return;
      }

      if (data.activated) {
        window.location.href = "/dashboard?checkout=success";
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCryptoCheckout() {
    if (!email) {
      setError("enter your email to continue");
      return;
    }
    setError(null);
    setCryptoLoading(true);

    try {
      const res = await fetch("/api/checkout/crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "checkout failed");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("something went wrong");
    } finally {
      setCryptoLoading(false);
    }
  }

  if (checkingAuth) return null;

  if (isPro) {
    return (
      <div className="flex min-h-screen flex-col">
        <AuthNav />
        <main className="flex flex-1 items-center justify-center px-5 pt-14">
          <div className="text-center animate-in">
            <h1
              className="text-4xl text-text-primary mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              you are on pro
            </h1>
            <p
              className="text-sm text-text-secondary mb-6"
              style={{ fontFamily: "var(--font-body)" }}
            >
              all pro features are active on your account.
            </p>
            <Link href="/dashboard" className="btn btn-dark">
              back to dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AuthNav />

      <main className="flex flex-1 flex-col items-center px-5 pt-28 pb-16">
        <div className="w-full max-w-3xl animate-in">
          <h1
            className="text-center text-4xl text-text-primary mb-10"
            style={{ fontFamily: "var(--font-display)" }}
          >
            pricing
          </h1>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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
            </div>
          </div>

          {/* Checkout Form */}
          <div className="card-elevated mx-auto max-w-md">
            <h2
              className="text-xl text-text-primary mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              go pro
            </h2>

            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="checkout-email" className="label">
                  email
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="checkout-coupon" className="label">
                  coupon (optional)
                </label>
                <input
                  id="checkout-coupon"
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="enter coupon code"
                  className="input"
                />
              </div>

              {error && (
                <p className="text-sm text-terracotta" style={{ fontFamily: "var(--font-body)" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="btn btn-dark w-full disabled:opacity-50"
              >
                {loading ? "..." : "go pro — $5/mo"}
              </button>

              <button
                onClick={handleCryptoCheckout}
                disabled={cryptoLoading}
                className="btn btn-outline w-full disabled:opacity-50"
              >
                {cryptoLoading ? "..." : "pay with crypto — $5"}
              </button>

              <p className="font-[family-name:var(--font-ui)] text-[11px] text-text-tertiary text-center mt-2">
                powered by stripe. cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
