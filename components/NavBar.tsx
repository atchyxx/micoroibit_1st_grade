"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "ホーム" },
  { href: "/quiz", label: "問題" },
  { href: "/analytics", label: "分析" },
  { href: "/progress", label: "進捗" },
  { href: "/settings", label: "設定" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      <ul>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link className={active ? "active" : ""} href={link.href}>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
