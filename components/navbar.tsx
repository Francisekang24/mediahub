"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTmdbAuth } from "@/components/tmdb-auth-provider";

const navItems = [
    { label: "Home", href: "/" },
    { label: "Movies", href: "/movies" },
    { label: "Series", href: "/series" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { accountId, isHydrated, sessionId } = useTmdbAuth();

    const isSignedIn =
        isHydrated && accountId.trim().length > 0 && sessionId.trim().length > 0;

    const visibleNavItems = isSignedIn
        ? [
              ...navItems,
              { label: "Dashboard", href: "/dashboard" },
              { label: "Watched Import", href: "/watched-import" },
          ]
        : navItems;

    return (
        <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-md">
            <nav className="mx-auto flex max-w-5xl items-center justify-center py-5">
                <ul className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                    {visibleNavItems.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={[
                                        "text-base font-semibold transition-colors md:text-lg",
                                        isActive
                                            ? "text-accent no-underline"
                                            : "text-foreground underline underline-offset-4 hover:text-accent",
                                    ].join(" ")}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </header>
    );
}