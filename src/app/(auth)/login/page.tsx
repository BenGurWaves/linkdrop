"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Nav from "@/components/nav";
import Footer from "@/components/footer";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          // If user already exists, auto sign-in instead
          if (
            signUpError.message.toLowerCase().includes("already registered") ||
            signUpError.message.toLowerCase().includes("already been registered") ||
            signUpError.message.toLowerCase().includes("user already registered")
          ) {
            const { data, error: signInError } =
              await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            const { data: page } = await supabase
              .from("ld_pages")
              .select("id")
              .eq("user_id", data.user.id)
              .limit(1)
              .single();

            router.push(page ? "/dashboard" : "/onboarding");
            return;
          }
          throw signUpError;
        }
        router.push("/onboarding");
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        // Check if user has an existing page
        const { data: page } = await supabase
          .from("ld_pages")
          .select("id")
          .eq("user_id", data.user.id)
          .limit(1)
          .single();

        router.push(page ? "/dashboard" : "/onboarding");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="flex flex-1 items-center justify-center px-5 pt-14">
        <div className="w-full max-w-sm animate-in">
          <h1 className="mb-8 text-center font-[family-name:var(--font-display)] text-4xl text-text-primary">
            {isSignUp ? "Create your page" : "Welcome back"}
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="at least 6 characters"
                required
                minLength={6}
                className="input"
              />
            </div>

            {error && (
              <p className="font-[family-name:var(--font-body)] text-sm text-terracotta">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary mt-2 w-full disabled:opacity-50"
            >
              {loading
                ? "..."
                : isSignUp
                  ? "create account"
                  : "sign in"}
            </button>
          </form>

          <p className="mt-6 text-center font-[family-name:var(--font-body)] text-sm text-text-secondary">
            {isSignUp ? "already have an account?" : "need an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="underline underline-offset-2 transition-colors hover:text-text-primary"
            >
              {isSignUp ? "sign in" : "sign up"}
            </button>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
