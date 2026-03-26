export default function GlyphPromo() {
  return (
    <a
      href="https://glyph.calyvent.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl border border-current/10 px-4 py-3 transition-colors hover:border-current/20"
    >
      <div className="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0 opacity-50"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="font-[family-name:var(--font-ui)] text-xs opacity-60">
          Need a QR code? Try Glyph — free
        </span>
      </div>
    </a>
  );
}
