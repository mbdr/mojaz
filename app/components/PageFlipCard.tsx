/**
 * Page Flip Card
 * Cycles through a list of report sections (Accidents, Maintenance, etc.)
 * inside a fixed-size card using a 3D "turning page" animation, like
 * flipping through pages of a book. Runs continuously, looping back to the
 * first page after the last.
 */

"use client";

import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

export interface FlipPage {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

interface PageFlipCardProps {
  pages: FlipPage[];
  intervalMs?: number;
  isRTL?: boolean;
}

const FLIP_DURATION_MS = 1100;

export function PageFlipCard({ pages, intervalMs = 4200, isRTL = false }: PageFlipCardProps) {
  const [index, setIndex] = useState(0);
  // Incrementing this forces the flipping layer to remount each cycle, which
  // reliably restarts its CSS animation from frame 0 every time (more
  // robust than toggling the `animation` property on the same element).
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;

    // Give the first page a moment to be read before the first flip, then
    // settle into the regular interval.
    const firstFlipDelay = Math.min(2400, intervalMs);
    const initialTimeout = setTimeout(() => setCycle((c) => c + 1), firstFlipDelay);
    const interval = setInterval(() => setCycle((c) => c + 1), intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [intervalMs, pages.length]);

  const nextIndex = (index + 1) % pages.length;

  // Pages turn from the binding edge: in RTL books that's the right edge,
  // in LTR books the left edge.
  const originSide = isRTL ? "right" : "left";
  const isFlipping = cycle > 0;

  return (
    <div className="relative h-full w-full" style={{ perspective: "1400px" }}>
      {/* Next page, sits underneath, revealed once the current page flips past 90deg */}
      <FlipPageContent page={pages[nextIndex]} />

      {/* Current page; remounts (key=cycle) every interval tick so its flip
          animation restarts cleanly, then advances `index` once it completes. */}
      <div
        key={cycle}
        className="absolute inset-0"
        style={{
          backfaceVisibility: "hidden",
          transformOrigin: originSide,
          animation: isFlipping
            ? `page-flip-${originSide} ${FLIP_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1) forwards`
            : undefined,
        }}
        onAnimationEnd={() => setIndex(nextIndex)}
      >
        <FlipPageContent page={pages[index]} shaded />
      </div>
    </div>
  );
}

function FlipPageContent({ page, shaded = false }: { page: FlipPage; shaded?: boolean }) {
  const Icon = page.icon;
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl px-2 text-center ${
        shaded ? "bg-gradient-to-b from-gray-50 to-white" : "bg-white"
      }`}
    >
      <Icon className="h-8 w-8 text-[var(--mojaz-red)]" />
      <p className="text-xs font-semibold text-gray-700">{page.title}</p>
      <p className="text-[10px] text-gray-400">{page.subtitle}</p>
    </div>
  );
}
