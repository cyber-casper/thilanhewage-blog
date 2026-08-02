import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/digest", label: "Digest" },
  { href: "/posts", label: "Posts" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-wordmark">
          Thilan Hewage
        </Link>
        <nav aria-label="Primary">
          <ul className="site-nav-links">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
