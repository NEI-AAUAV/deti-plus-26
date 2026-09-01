"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { PixelCross } from "./pixel-elements";

const links = [
  { label: "About", href: "#about" },
  { label: "Countdown", href: "#countdown" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "Timeline", href: "#timeline" },
  { label: "Associations", href: "#associations" },
  { label: "Contacts", href: "#contacts" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("#about");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      setProgress(
        scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0,
      );
    };

    updateProgress();

    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  useEffect(() => {
    const elements = links
      .map((link) => document.querySelector(link.href))
      .filter((element): element is Element => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <nav
        aria-label="Main navigation"
        className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="deti+ home"
          >
            <span className="font-display text-2xl lowercase tracking-wide text-primary">
              deti
            </span>
            <span className="font-display text-2xl text-accent">+</span>
          </Link>

          <ul className="hidden items-center gap-5 md:flex lg:gap-7">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={`/${link.href}`}
                  className={cn(
                    "relative py-2 font-sans text-xs uppercase tracking-widest transition-colors lg:text-sm",
                    activeSection === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-1 h-px origin-left bg-accent transition-transform duration-200",
                      activeSection === link.href
                        ? "scale-x-100"
                        : "scale-x-0",
                    )}
                  />
                </Link>
              </li>
            ))}

            <li>
              <Link
                href="/registration/"
                className="inline-flex items-center border-2 border-accent bg-accent px-4 py-2 font-sans text-xs uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-accent lg:text-sm"
              >
                Register <span className="ml-2">→</span>
              </Link>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-primary md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? (
              <PixelCross className="h-5 w-5 rotate-45" />
            ) : (
              <div className="flex flex-col gap-1.5" aria-hidden="true">
                <div className="h-0.5 w-6 bg-primary" />
                <div className="h-0.5 w-6 bg-primary" />
                <div className="h-0.5 w-6 bg-primary" />
              </div>
            )}
          </button>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[-1px] h-[2px]"
        >
          <div
            className="h-full bg-accent transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          id="mobile-menu"
          inert={!open}
          className={cn(
            "grid transition-all duration-300 ease-in-out md:hidden",
            open
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden bg-background">
            <ul className="flex flex-col gap-4 border-t border-border px-6 py-6">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={`/${link.href}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "font-sans text-sm uppercase tracking-widest transition-colors",
                      activeSection === link.href
                        ? "text-accent"
                        : "text-muted-foreground hover:text-primary",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              <li>
                <Link
                  href="/registration/"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center border-2 border-accent bg-accent px-4 py-2 font-sans text-sm uppercase tracking-widest text-background"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
