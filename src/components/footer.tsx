import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border-light py-6 px-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary">
          linkdrop by calyvent &copy; 2026
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary hover:text-text-secondary transition-colors"
          >
            pricing
          </Link>
          <a
            href="https://glyph.calyvent.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-ui)] text-[11px] lowercase text-text-tertiary hover:text-text-secondary transition-colors"
          >
            glyph qr
          </a>
        </div>
      </div>
    </footer>
  );
}
