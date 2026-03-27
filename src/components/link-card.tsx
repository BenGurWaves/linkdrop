import type { LdLink } from "@/lib/supabase";
import SocialIcon from "./social-icon";

export default function LinkCard({
  link,
  style,
  bodyFontClass,
  trackingUrl,
}: {
  link: LdLink;
  style: { bg: string; text: string };
  bodyFontClass?: string;
  trackingUrl?: string;
}) {
  const href = trackingUrl ?? link.url;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full rounded-xl px-5 py-3.5 text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
    >
      <span className={`inline-flex items-center gap-2 ${bodyFontClass ?? "font-[family-name:var(--font-body)]"} text-sm font-medium`}>
        {link.icon && <SocialIcon platform={link.icon} size={16} />}
        {link.title}
      </span>
    </a>
  );
}
