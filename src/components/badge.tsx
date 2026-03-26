export default function Badge() {
  return (
    <a
      href="https://linkdrop.calyvent.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 opacity-40 hover:opacity-60 transition-opacity"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 40 40"
        fill="none"
        className="h-3.5 w-3.5"
      >
        <path
          d="M20 4C20 4 8 18 8 26a12 12 0 0 0 24 0C32 18 20 4 20 4z"
          fill="currentColor"
        />
      </svg>
      <span className="font-[family-name:var(--font-ui)] text-[9px] uppercase tracking-widest">
        Made with LinkDrop&trade;
      </span>
    </a>
  );
}
