/* ==========================================================================
   smooth-scroll.ts: site-wide smooth scrolling with Lenis
   Gives mouse-wheel and trackpad scrolling a gentle glide and ease-out,
   instead of the browser's choppy steps. Kept in sync with GSAP so all
   scroll animations (like the Intro highlight) follow it exactly.

   - Phones and tablets keep their native scrolling (already smooth)
   - Turned off for visitors with "Reduce motion" on
   - Links to sections on the page (#about, #work, #intro...) glide too
   ========================================================================== */

import Lenis from "lenis";
import "lenis/dist/lenis.css"; // small set of styles Lenis needs
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (!prefersReducedMotion) {
  const lenis = new Lenis({
    // How "floaty" the scroll feels: lower = smoother and slower to settle,
    // higher = snappier. 0.1 is a good middle ground.
    lerp: 0.1,
    // Same-page links (href="#section") glide to their target
    anchors: true,
  });

  // Keep GSAP's scroll animations in step with Lenis:
  // 1. every time Lenis scrolls, ScrollTrigger re-checks positions
  lenis.on("scroll", ScrollTrigger.update);
  // 2. Lenis runs on GSAP's animation clock, so both update on the same frame
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
