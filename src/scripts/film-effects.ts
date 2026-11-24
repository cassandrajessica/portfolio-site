/* ==========================================================================
   film-effects.ts: frame-by-frame film dust, fibers and scratches
   Draws old-film imperfections onto the <canvas class="bg-film"> in
   Base.astro. Like real projected film, the dust changes every frame:
   about 10 times a second the canvas is wiped and a fresh random set of
   marks is drawn. A long wobbly scratch shows up now and then and stays
   for a moment before disappearing.
   ========================================================================== */

// ---------- Settings: tweak these to taste ----------
const SETTINGS = {
  fps: 4, // frames per second; real film flicker feels right around 8 to 12

  // Specks (tiny dots) drawn per frame
  minSpecks: 6,
  maxSpecks: 20,
  bigSpeckChance: 0.12, // share of specks that are larger irregular blobs

  // Fibers (short wiggly hairs) drawn per frame
  minFibers: 0,
  maxFibers: 2,
  branchChance: 0.3, // chance a fiber has a small branch

  // Long scratch
  scratchStartChance: 0.015, // chance per frame that a new scratch begins
  minScratchFrames: 5,       // how long it stays, in frames (10 frames = 1 second)
  maxScratchFrames: 18,
  scratchGapChance: 0.08,    // chance each piece of the scratch is skipped, so it looks broken

  // Opacity range for all marks
  minOpacity: 0.15,
  maxOpacity: 0.5,
};

// ---------- Helpers ----------
const random = (min: number, max: number) => min + Math.random() * (max - min);
const randomInt = (min: number, max: number) => Math.floor(random(min, max + 1));
const chance = (probability: number) => Math.random() < probability;

// ---------- Setup ----------
const canvas = document.querySelector<HTMLCanvasElement>(".bg-film");
const ctx = canvas?.getContext("2d");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Do nothing for visitors who asked for less motion, or if the canvas is missing
if (canvas && ctx && !prefersReducedMotion) {
  // Mark color comes from the design system, so it always matches --color-ink
  const inkColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--color-ink")
      .trim() || "#1c1b1a";

  let width = 0;
  let height = 0;

  // Matches the canvas to the screen size. On Retina screens
  // (devicePixelRatio 2 or more) it draws at a higher resolution so the
  // thin lines stay crisp instead of blurry.
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const setStyle = (opacity: number, lineWidth = 1) => {
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  // ---------- Speck: a pinpoint, or a small irregular blob ----------
  const drawSpeck = () => {
    const x = random(0, width);
    const y = random(0, height);
    setStyle(random(SETTINGS.minOpacity, SETTINGS.maxOpacity));

    if (chance(SETTINGS.bigSpeckChance)) {
      // Irregular blob: a lumpy shape made of points at random distances
      const points = randomInt(5, 8);
      const size = random(1.2, 2.8);
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = size * random(0.6, 1.3);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Pinpoint
      ctx.beginPath();
      ctx.arc(x, y, random(0.4, 1.1), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // ---------- Fiber: a short wiggly line that changes direction as it goes ----------
  const drawStrand = (startX: number, startY: number, segments: number, angle: number) => {
    let x = startX;
    let y = startY;
    const path: [number, number][] = [[x, y]];

    for (let i = 0; i < segments; i++) {
      angle += random(-0.9, 0.9); // turn a little at each step
      const step = random(2, 6);
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      path.push([x, y]);
    }

    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i][0], path[i][1]);
    ctx.stroke();
    return path;
  };

  const drawFiber = () => {
    setStyle(random(SETTINGS.minOpacity, SETTINGS.maxOpacity), random(0.6, 1.1));
    const path = drawStrand(
      random(0, width),
      random(0, height),
      randomInt(4, 9),
      random(0, Math.PI * 2)
    );

    // Sometimes a small branch splits off partway along
    if (chance(SETTINGS.branchChance)) {
      const [bx, by] = path[randomInt(1, path.length - 2)];
      drawStrand(bx, by, randomInt(2, 4), random(0, Math.PI * 2));
    }
  };

  // ---------- Long scratch: a wobbly line running down the screen ----------
  type Scratch = {
    x: number;           // base horizontal position
    framesLeft: number;  // how many more frames it stays
    waveSize: number;    // how far it wanders side to side
    waveLength: number;  // how stretched out the wobbles are
    phase: number;       // where the wobble pattern starts
    opacity: number;
    lineWidth: number;
    top: number;         // where it starts and ends vertically
    bottom: number;
  };
  let scratch: Scratch | null = null;

  const startScratch = () => {
    scratch = {
      x: random(width * 0.05, width * 0.95),
      framesLeft: randomInt(SETTINGS.minScratchFrames, SETTINGS.maxScratchFrames),
      waveSize: random(2, 7),
      waveLength: random(120, 320),
      phase: random(0, Math.PI * 2),
      opacity: random(0.2, 0.4),
      lineWidth: random(0.7, 1.2),
      top: chance(0.6) ? 0 : random(0, height * 0.4),
      bottom: chance(0.6) ? height : random(height * 0.6, height),
    };
  };

  const drawScratch = (s: Scratch) => {
    // Each frame the whole scratch shifts slightly, like film wobbling in
    // the projector
    const jitter = random(-1.5, 1.5);
    setStyle(s.opacity * random(0.8, 1), s.lineWidth);

    const step = 12; // draw in short pieces, so some can be skipped
    for (let y = s.top; y < s.bottom; y += step) {
      if (chance(SETTINGS.scratchGapChance)) continue;
      const xAt = (yy: number) =>
        s.x + jitter + Math.sin(yy / s.waveLength + s.phase) * s.waveSize;
      ctx.beginPath();
      ctx.moveTo(xAt(y), y);
      ctx.lineTo(xAt(y + step), y + step);
      ctx.stroke();
    }
  };

  // ---------- Draw one frame ----------
  const drawFrame = () => {
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);

    const specks = randomInt(SETTINGS.minSpecks, SETTINGS.maxSpecks);
    for (let i = 0; i < specks; i++) drawSpeck();

    const fibers = randomInt(SETTINGS.minFibers, SETTINGS.maxFibers);
    for (let i = 0; i < fibers; i++) drawFiber();

    if (!scratch && chance(SETTINGS.scratchStartChance)) startScratch();
    if (scratch) {
      drawScratch(scratch);
      scratch.framesLeft -= 1;
      if (scratch.framesLeft <= 0) scratch = null;
    }
  };

  // ---------- The loop ----------
  // requestAnimationFrame runs about 60 times a second and automatically
  // pauses when the tab is hidden. We only draw a new frame when enough
  // time has passed for our film frame rate.
  const frameDuration = 1000 / SETTINGS.fps;
  let lastFrame = 0;

  const loop = (time: number) => {
    if (time - lastFrame >= frameDuration) {
      lastFrame = time;
      drawFrame();
    }
    requestAnimationFrame(loop);
  };

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(loop);
}
