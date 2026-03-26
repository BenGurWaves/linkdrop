import Link from "next/link";

function LogoSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      fill="none"
      className="h-7 w-7"
    >
      <path
        d="M20 4C20 4 8 18 8 26a12 12 0 0 0 24 0C32 18 20 4 20 4z"
        fill="#3A3A38"
      />
      <rect
        x="15"
        y="18"
        width="10"
        height="5"
        rx="2.5"
        fill="none"
        stroke="#F5F0EB"
        strokeWidth="1.8"
      />
      <rect
        x="15"
        y="24"
        width="10"
        height="5"
        rx="2.5"
        fill="none"
        stroke="#F5F0EB"
        strokeWidth="1.8"
      />
      <line
        x1="18"
        y1="23"
        x2="18"
        y2="24"
        stroke="#F5F0EB"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="22"
        y1="23"
        x2="22"
        y2="24"
        stroke="#F5F0EB"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Nav({ dashboard }: { dashboard?: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-light bg-surface-primary/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <LogoSvg />
          <span className="text-xl tracking-tight text-text-primary font-[family-name:var(--font-display)]">
            LinkDrop
          </span>
        </Link>

        <div className="flex items-center gap-5">
          {dashboard ? (
            <Link
              href="/dashboard"
              className="font-[family-name:var(--font-ui)] text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/pricing"
                className="font-[family-name:var(--font-ui)] text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                pricing
              </Link>
              <Link href="/login" className="btn btn-dark text-xs">
                sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
