"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, MessageCircleHeart, Users, LifeBuoy } from "lucide-react";

const TABS = [
  { href: "/", label: "Beranda", Icon: Home },
  { href: "/insight", label: "Insight", Icon: BarChart3 },
  { href: "/triage", label: "Rehat AI", Icon: MessageCircleHeart },
  { href: "/komunitas", label: "Komunitas", Icon: Users },
  { href: "/bantuan", label: "Bantuan", Icon: LifeBuoy },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-[#e1e8e5] bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-start justify-between px-6 pb-3 pt-3">
        {TABS.map(({ href, label, Icon }) => {
          const aktif = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={aktif ? "page" : undefined}
                className={
                  "flex min-w-[45px] flex-col items-center gap-1 text-[11px] font-semibold transition-colors " +
                  (aktif ? "text-[#2f7f73]" : "text-[#8a9893] hover:text-[#5b6b66]")
                }
              >
                <Icon className="h-6 w-6" strokeWidth={aktif ? 2.4 : 2} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}