/* ==========================================================================
   text-reveal.ts: titles slide up line by line as they scroll into view
   Add data-text-reveal to any heading (or any text element) and, the
   first time it enters the screen, each of its lines slides up from
   behind an invisible edge, one after another. Works anywhere on the site.

   Options (as attributes on the same element):
     data-text-reveal              the lines slide up in turn
     data-text-reveal-delay="0.2"  waits this many seconds before starting

   Visitors with "Reduce motion" on just see the text in place.

   Tip: don't use text-indent on an element with data-text-reveal. While
   measuring the lines, every word inherits the indent and the lines break
   in the wrong places. Use an inline spacer instead (see Intro.astro).
   ========================================================================== */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Settings: tweak these to taste
const DURATION = 1;      // seconds for each line to slide up
const STAGGER = 0.12;    // seconds between one line and the next
const START = "top 85%"; // begins when the element's top is 85% down the screen

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const elements = document.querySelectorAll<HTMLElement>("[data-text-reveal]");

if (elements.length && !prefersReducedMotion) {
  // Wait until Anton has loaded, so lines are measured with the real font
  document.fonts.load(`1em "Anton"`).then(() => {
    elements.forEach((el) => {
      SplitText.create(el, {
        type: "lines",
        mask: "lines", // wraps each line in a clipped box it can slide up through
        autoSplit: true, // re-splits when the window resizes and lines re-wrap
        onSplit(self) {
          // The lines are about to be parked below their edges, so it's now
          // safe to un-hide the element (see "Waiting to animate" in
          // global.css)
          gsap.set(el, { visibility: "visible" });

          // Returning the animation lets SplitText keep it in sync if the
          // lines are re-split later
          return gsap.from(self.lines, {
            yPercent: 110,
            duration: DURATION,
            ease: "power4.out",
            stagger: STAGGER,
            delay: Number(el.dataset.textRevealDelay) || 0,
            scrollTrigger: {
              trigger: el,
              start: START,
              once: true, // plays the first time only
            },
          });
        },
      });
    });
  });
}
