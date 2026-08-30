"use client";

import { useState } from "react";
import Link from "next/link";

import { PixelCross } from "./pixel-elements";

const links = [
  { label: "About", href: "#about" },
  { label: "Countdown", href: "#countdown" },
  { label: "Associations", href: "#associations" },
  { label: "Timeline", href: "#timeline" },
  { label: "Sponsors", href: "#sponsors" },
  { label: "Contacts", href: "#contacts" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <nav
        aria-label="Main navigation"
        className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2" aria-label="deti+ home">
            <span className="font-display text-2xl lowercase tracking-wide text-primary">
              deti
            </span>
            <span className="font-display text-2xl text-accent">+</span>
          </Link>

          <ul className="hidden items-center gap-6 md:flex lg:gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={`/${l.href}`}
                  className="font-sans text-sm uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/registration/"
                className="inline-flex items-center border-2 border-accent bg-accent px-4 py-2 font-sans text-sm uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-accent"
              >
                Register
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

        {/* `inert` keeps the collapsed panel out of the tab order and the
            accessibility tree while the CSS collapse animation still runs. */}
        <div
          id="mobile-menu"
          inert={!open}
          className={`grid transition-all duration-300 ease-in-out md:hidden ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden bg-background">
            <ul className="flex flex-col gap-4 border-t border-border px-6 py-6">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={`/${l.href}`}
                    onClick={() => setOpen(false)}
                    className="font-sans text-sm uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
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
