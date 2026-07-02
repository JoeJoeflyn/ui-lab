"use client";

import Link from "next/link";
import { Landmark, Palette, Sparkles, Menu, Terminal, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "#west-wing", label: "West Wing", icon: Landmark, desc: "Interactive Effects" },
  { href: "#east-wing", label: "East Wing", icon: Palette, desc: "Cinematic Animations" },
  { href: "#salon", label: "Salon", icon: Sparkles, desc: "Particle Paintings" },
  { href: "#ascii", label: "Terminal", icon: Terminal, desc: "ASCII Animation" },
  { href: "#colony", label: "Colony", icon: Bug, desc: "Ant Text Swarm" },
] as const;

export function NavRail() {
  return (
    <>
      {/* Desktop: Codex-style rail — horizontal ticks only, centered.
          Hovering a tick shows a floating icon + title label for THAT item only. */}
      <nav className="fixed left-1.5 top-0 z-40 hidden h-full w-6 md:flex md:items-center md:justify-center">
        <div className="relative flex flex-col items-center">
          {/* Logo tick */}
          <Link
            href="/"
            className="group/item relative flex h-4 w-6 items-center justify-center"
          >
            <span className="h-0.5 w-full bg-gold shadow-[0_0_6px_var(--gold)] transition-all duration-200 group-hover/item:h-1 group-hover/item:shadow-[0_0_10px_var(--gold)]" />
            <span className="pointer-events-none absolute left-7 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-md border border-gold/30 bg-card px-3 py-1.5 opacity-0 shadow-xl transition-all duration-200 group-hover/item:opacity-100 whitespace-nowrap">
              <svg width="14" height="14" viewBox="0 0 28 28" fill="none" className="size-3.5 shrink-0 text-gold">
                <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
                <circle cx="14" cy="14" r="7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                <circle cx="14" cy="14" r="2.5" fill="currentColor" />
              </svg>
              <span className="text-xs font-bold tracking-tight text-card-foreground"
                style={{ fontFamily: "var(--font-heading), serif" }}>
                UI Lab
              </span>
            </span>
          </Link>

          {/* Nav item ticks — close together */}
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group/item relative flex h-4 w-6 items-center justify-center"
            >
              <span className="h-0.5 w-full bg-gold/80 shadow-[0_0_6px_var(--gold)] transition-all duration-200 group-hover/item:h-1 group-hover/item:bg-gold group-hover/item:shadow-[0_0_12px_var(--gold)]" />
              <span className="pointer-events-none absolute left-7 top-1/2 flex -translate-y-1/2 items-center gap-2.5 rounded-md border border-gold/30 bg-card px-3 py-2 opacity-0 shadow-xl transition-all duration-200 group-hover/item:opacity-100 whitespace-nowrap">
                <item.icon className="size-4 shrink-0 text-gold" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </span>
            </Link>
          ))}

          {/* Footer tick */}
          <div className="group/item relative flex h-4 w-6 items-center justify-center">
            <span className="h-0.5 w-full bg-gold/60 shadow-[0_0_4px_var(--gold)] transition-all duration-200 group-hover/item:h-1 group-hover/item:bg-gold/80" />
            <span className="pointer-events-none absolute left-7 top-1/2 -translate-y-1/2 rounded-md border border-gold/30 bg-card px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 opacity-0 shadow-xl transition-all duration-200 group-hover/item:opacity-100 whitespace-nowrap">
              125+ Effects
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile: fixed top bar with hamburger */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center border-b border-gold/20 bg-background px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none" className="text-gold">
            <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <circle cx="14" cy="14" r="7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="14" cy="14" r="2.5" fill="currentColor" />
            <circle cx="14" cy="2" r="1" fill="currentColor" opacity="0.6" />
            <circle cx="26" cy="14" r="1" fill="currentColor" opacity="0.6" />
            <circle cx="14" cy="26" r="1" fill="currentColor" opacity="0.6" />
            <circle cx="2" cy="14" r="1" fill="currentColor" opacity="0.6" />
          </svg>
          <span
            className="text-sm font-bold tracking-tight text-card-foreground"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            UI Lab
          </span>
        </Link>

        <div className="flex-1" />

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-gold"
            >
              <Menu className="size-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold/60">
                Gallery
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <item.icon className="size-4 shrink-0 text-gold/60" />
                    <div>
                      <div className="font-medium text-foreground">{item.label}</div>
                      <div className="text-[10px] leading-tight text-muted-foreground/60">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
