/* ==========================================================================
   reveal.ts: content rises into view as you scroll
   Add data-reveal to any element and it gently fades in and slides up the
   first time it enters the screen. Works anywhere on the site.

   Options (as attributes on the same element):
     data-reveal                 the element rises in on its own
     data-reveal="stagger"       its direct children rise in one after
                                 another (good for lists and rows)
     data-reveal-delay="0.2"     waits this many seconds before starting

   Visitors with "Reduce motion" on just see everything in place.
   ========================================================================== */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Settings: tweak these to taste
const DISTANCE = 36;   // pixels each element rises
const DURATION = 0.9;  // seconds for the rise
const STAGGER = 0.1;   // seconds between children in "stagger" mode
const START = "top 88%"; // begins when the element's top is 88% down the screen

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (!prefersReducedMotion) {
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const isStagger = el.dataset.reveal === "stagger";
    const targets = isStagger ? Array.from(el.children) : el;

    gsap.from(targets, {
      y: DISTANCE,
      opacity: 0,
      duration: DURATION,
      ease: "power3.out",
      delay: Number(el.dataset.revealDelay) || 0,
      stagger: isStagger ? STAGGER : 0,
      scrollTrigger: {
        trigger: el,
        start: START,
        once: true, // animates the first time only, then stays put
      },
    });

    // The animation above has already set the starting state (faded and
    // lowered), so it's now safe to un-hide the element. See "Waiting to
    // animate" in global.css.
    gsap.set(targets, { visibility: "visible" });
  });
}
