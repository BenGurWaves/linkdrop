import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-light py-6 px-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary">
          linkdrop&trade; by calyvent &copy; 2026
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary hover:text-text-secondary transition-colors"
          >
            pricing
          </Link>
          <Link
            href="/legal/terms"
            className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary hover:text-text-secondary transition-colors"
          >
            terms
          </Link>
          <Link
            href="/legal/privacy"
            className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary hover:text-text-secondary transition-colors"
          >
            privacy
          </Link>
          <Link
            href="/legal/cookies"
            className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary hover:text-text-secondary transition-colors"
          >
            cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
