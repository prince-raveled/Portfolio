/* =========================================================
   Atmosphere — wind, grass, dust, fireflies, curtain.

   The organising idea is that wind is a character: a single
   gust value drives the grass, the dust, the leaves and the
   nav mark together, so the page feels weather-driven rather
   than like a set of unrelated loops. Everything here is
   decorative and bails out entirely under reduced motion.
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const small = window.innerWidth < 720;

  /* ---------------- Opening curtain ---------------- */
  const curtain = document.getElementById("curtain");
  if (curtain) {
    const lift = () => {
      curtain.classList.add("lifted");
      // stop the leaf animating once it is out of sight
      setTimeout(() => curtain.remove(), 1200);
    };
    if (reduceMotion) {
      curtain.remove();
    } else if (document.readyState === "complete") {
      setTimeout(lift, 260);
    } else {
      window.addEventListener("load", () => setTimeout(lift, 420));
      // never let a slow image hold the page hostage
      setTimeout(lift, 2600);
    }
  }

  if (reduceMotion) return;

  /* ---------------- Grass along the foot of the hero ----------------
     Blades are generated rather than hand-drawn so each one can carry
     its own period and phase — a hand-drawn strip sways as one slab,
     which reads as fabric instead of grass. */
  const grass = document.getElementById("grass");
  if (grass) {
    const W = 1200;
    const H = 200;
    // each blade's keyframe reads var(--wind), so every blade restyles on every
    // frame of a gust — keep the count modest so a gust stays cheap
    const COUNT = small ? 26 : 46;
    const blades = [];

    for (let i = 0; i < COUNT; i++) {
      const x = (i / COUNT) * W + (Math.random() - 0.5) * 14;
      const h = 58 + Math.random() * 108;          // blade height
      const lean = (Math.random() - 0.5) * 46;     // how far the tip leans
      const width = 3 + Math.random() * 5;
      const dur = (3.8 + Math.random() * 3.4).toFixed(2);
      const delay = (-Math.random() * 6).toFixed(2);
      // roots sit at varying depths below the clip edge, so the bases never
      // line up into a visible straight seam across the page
      const root = H + 6 + Math.random() * 22;
      // stroke is currentColor so the whole field can re-tint per theme
      const shade = 0.24 + Math.random() * 0.4;

      blades.push(
        `<path class="blade" d="M${x.toFixed(1)} ${root.toFixed(1)} Q ${(x + lean * 0.35).toFixed(1)} ${(H - h * 0.55).toFixed(1)} ${(x + lean).toFixed(1)} ${(H - h).toFixed(1)}"
           stroke="currentColor" stroke-opacity="${shade.toFixed(2)}" stroke-width="${width.toFixed(1)}"
           stroke-linecap="round" fill="none"
           style="--dur:${dur}s; --delay:${delay}s"/>`
      );
    }

    grass.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${blades.join("")}</svg>`;
  }

  /* ---------------- Dust motes ---------------- */
  const dust = document.getElementById("dust");
  if (dust) {
    const COUNT = small ? 10 : 20;
    for (let i = 0; i < COUNT; i++) {
      const m = document.createElement("div");
      m.className = "mote";
      const size = 2 + Math.random() * 5;
      m.style.width = `${size}px`;
      m.style.height = `${size}px`;
      m.style.left = `${Math.random() * 100}%`;
      m.style.setProperty("--peak", (0.35 + Math.random() * 0.5).toFixed(2));
      m.style.animationDuration = `${18 + Math.random() * 26}s`;
      m.style.animationDelay = `${-Math.random() * 40}s`;
      dust.appendChild(m);
    }
  }

  /* ---------------- Wind ----------------
     One gust value, shared by every swaying thing on the page. */
  const streaks = document.getElementById("windStreaks");
  const CALM = 0.08;

  const spawnStreaks = (strength) => {
    if (!streaks || small) return;
    const n = Math.round(1 + strength * 3);
    for (let i = 0; i < n; i++) {
      const s = document.createElement("div");
      s.className = "streak";
      s.style.top = `${8 + Math.random() * 78}%`;
      s.style.width = `${90 + Math.random() * 190}px`;
      s.style.animationDelay = `${Math.random() * 0.5}s`;
      s.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
      streaks.appendChild(s);
      setTimeout(() => s.remove(), 2600);
    }
  };

  let windTimer = null;
  const gust = () => {
    const strength = 0.45 + Math.random() * 0.55;
    root.style.setProperty("--wind", strength.toFixed(2));
    spawnStreaks(strength);

    // let it die back down, then wait a while — the stillness between
    // gusts is the point, not the gust itself
    setTimeout(() => root.style.setProperty("--wind", String(CALM)), 1900 + Math.random() * 1500);
    windTimer = setTimeout(gust, 7000 + Math.random() * 9000);
  };

  root.style.setProperty("--wind", String(CALM));
  windTimer = setTimeout(gust, 2600);

  // don't animate weather nobody is watching
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(windTimer);
      root.style.setProperty("--wind", String(CALM));
    } else if (!windTimer) {
      windTimer = setTimeout(gust, 1800);
    }
  });

})();
