/* =========================================================
   Prince Kumar — Ghibli Resume · motion layer
   Lenis (smooth inertia scroll) + GSAP ScrollTrigger,
   with a full IntersectionObserver fallback if the CDN
   is blocked or offline.
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const hasGSAP = !!(gsap && ScrollTrigger) && !reduceMotion;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------
     1. Smooth scroll — this is what stitches the sections together so
        the page reads as one continuous surface instead of a stack of
        separate images.
     ------------------------------------------------------------------ */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.3 });
    else if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  /* ------------------------------------------------------------------
     2. Split headings for the mask reveal.
        Characters are inline-block so they can animate individually —
        which means the browser would happily break a line *inside* a
        word. Wrapping each word in a nowrap span keeps words whole.
     ------------------------------------------------------------------ */
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    let i = 0;
    el.innerHTML = words
      .map((word) => {
        const chars = Array.from(word)
          .map((c) => `<span class="ch" style="--i:${i++}"><span class="ch-i">${esc(c)}</span></span>`)
          .join("");
        return `<span class="word">${chars}</span>`;
      })
      .join(" ");
  });

  /* ------------------------------------------------------------------
     3. Reveal on enter — GSAP where available, IO otherwise
     ------------------------------------------------------------------ */
  const revealTargets = document.querySelectorAll("[data-split], [data-fade], [data-rise], .timeline-item, #cgpaDial");

  if (reduceMotion) {
    revealTargets.forEach((el) => el.classList.add("is-in"));
  } else if (hasGSAP) {
    revealTargets.forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => el.classList.add("is-in"),
      });
    });
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  }

  // stagger siblings that share a parent so groups cascade rather than pop
  const groups = new Map();
  document.querySelectorAll("[data-rise], [data-fade]").forEach((el) => {
    const p = el.parentElement;
    if (!groups.has(p)) groups.set(p, []);
    groups.get(p).push(el);
  });
  groups.forEach((els) => {
    els.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
    });
  });

  /* ------------------------------------------------------------------
     4. Scroll-linked motion: interlude bands open + drift, panels lift,
        polaroids float at different depths.
     ------------------------------------------------------------------ */
  if (hasGSAP) {
    // interlude images open from a slit and drift — the "one continuous
    // camera move" feel rather than a hard cut between pictures
    document.querySelectorAll(".interlude").forEach((band) => {
      const frame = band.querySelector(".interlude-frame");
      const img = band.querySelector(".interlude-img");

      gsap.fromTo(
        frame,
        { clipPath: "inset(26% 12% 26% 12% round 34px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 34px)",
          ease: "none",
          scrollTrigger: { trigger: band, start: "top 85%", end: "top 25%", scrub: 0.8 },
        }
      );

      gsap.fromTo(
        img,
        { yPercent: -10, scale: 1.18 },
        {
          yPercent: 10,
          scale: 1.02,
          ease: "none",
          scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: 0.8 },
        }
      );
    });

    // panels rise into place and settle
    document.querySelectorAll(".panel").forEach((panel) => {
      gsap.fromTo(
        panel,
        { y: 70, scale: 0.975, opacity: 0.7 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: panel, start: "top 92%", end: "top 55%", scrub: 0.7 },
        }
      );
    });

    // the portrait holds its ground a beat longer, then follows
    gsap.to(".portrait-orb", {
      y: -60,
      scale: 0.94,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1.2 },
    });

    // hero copy parts as you leave. Targets the wrapper, never the children —
    // the children run their own CSS entrance animation on load, and an inline
    // GSAP opacity on them would freeze that animation's end state.
    gsap.to(".hero-copy", {
      y: -50,
      opacity: 0.12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "12% top", end: "bottom top", scrub: 1 },
    });

    // the camera roll runs itself (section 14) — just fade the strip in
    const roll = document.getElementById("lens");
    if (roll) {
      gsap.fromTo(
        roll,
        { opacity: 0.35, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: roll, start: "top 88%", once: true },
        }
      );
    }

    // certificate reel slides horizontally as the section passes
    const reelTrack = document.getElementById("reelTrack");
    if (reelTrack) {
      const overflow = () => Math.max(0, reelTrack.scrollWidth - window.innerWidth + 80);
      gsap.to(reelTrack, {
        x: () => -overflow(),
        ease: "none",
        scrollTrigger: {
          trigger: "#awards",
          start: "bottom 92%",
          end: () => `+=${overflow() + window.innerHeight * 0.5}`,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }

    // timeline progress line
    const timeline = document.getElementById("timeline");
    const timelineFill = document.getElementById("timelineFill");
    if (timeline && timelineFill) {
      gsap.fromTo(
        timelineFill,
        { height: "0%" },
        {
          height: "100%",
          ease: "none",
          scrollTrigger: { trigger: timeline, start: "top 75%", end: "bottom 65%", scrub: 0.6 },
        }
      );
    }

    window.addEventListener("load", () => ScrollTrigger.refresh());
  } else if (!reduceMotion) {
    /* --- lightweight fallback parallax --- */
    const drifters = Array.from(document.querySelectorAll(".interlude-img"));
    const timeline = document.getElementById("timeline");
    const timelineFill = document.getElementById("timelineFill");
    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;
      drifters.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect();
        const shift = ((r.top + r.height / 2 - vh / 2) / vh) * -8;
        el.style.transform = `translate3d(0, ${shift.toFixed(2)}%, 0)`;
      });
      if (timeline && timelineFill) {
        const r = timeline.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
        timelineFill.style.height = `${pct * 100}%`;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ------------------------------------------------------------------
     5. CGPA counter
     ------------------------------------------------------------------ */
  const dial = document.getElementById("cgpaDial");
  const numEl = document.getElementById("cgpaNum");
  const dialFg = dial && dial.querySelector(".dial-fg");
  if (dial && numEl && dialFg) {
    const target = 8.49;
    const CIRC = 2 * Math.PI * 52; // r = 52 in the SVG viewBox
    let counted = false;

    const paint = (value) => {
      numEl.textContent = value.toFixed(2);
      dialFg.style.strokeDashoffset = String(CIRC - CIRC * (value / 10));
    };

    const run = () => {
      if (counted) return;
      counted = true;
      if (reduceMotion) { paint(target); return; }
      const start = performance.now();
      const dur = 1600;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        paint(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          run();
          obs.disconnect();
        });
      },
      { threshold: 0.35 }
    ).observe(dial);
  }

  /* ------------------------------------------------------------------
     6. Nav: scroll state, active link, burger, smooth anchors
     ------------------------------------------------------------------ */
  const nav = document.getElementById("nav");
  const navBurger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  const navAnchors = Array.from(navLinks.querySelectorAll("a"));

  navBurger.addEventListener("click", () => {
    navBurger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  navAnchors.forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        scrollToTarget(href);
      }
      navBurger.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });

  document.querySelectorAll('.btn-pill[href^="#"], .scroll-cue[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTarget(a.getAttribute("href"));
    });
  });

  const spySections = Array.from(document.querySelectorAll("main > section[id], .hero, footer[id]"));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    spySections.forEach((s) => s.id && spy.observe(s));
  }

  /* ------------------------------------------------------------------
     7. One scroll pass
        The nav state, the progress rail and the back-to-top button used to
        listen for scroll separately, each reading layout on every event.
        They now share a single rAF-throttled pass: read everything once,
        then write, so a scroll costs one frame of work instead of three.
     ------------------------------------------------------------------ */
  const rail = document.getElementById("scrollRail");
  const totoroTop = document.getElementById("totoroTop");
  const heroEl = document.getElementById("hero");

  let scrollTicking = false;
  let cachedMax = 0;
  let cachedHeroH = 0;

  const measure = () => {
    cachedMax = document.documentElement.scrollHeight - window.innerHeight;
    cachedHeroH = heroEl ? heroEl.offsetHeight : 0;
  };

  const onScrollFrame = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    if (rail) rail.style.height = `${cachedMax > 0 ? (y / cachedMax) * 100 : 0}%`;
    if (totoroTop) totoroTop.classList.toggle("visible", y > cachedHeroH * 0.6);
    scrollTicking = false;
  };

  const requestScrollFrame = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(onScrollFrame);
  };

  measure();
  onScrollFrame();
  document.addEventListener("scroll", requestScrollFrame, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    requestScrollFrame();
  });

  /* ------------------------------------------------------------------
     8. Theme toggle (day / dusk)
     ------------------------------------------------------------------ */
  const themeToggle = document.getElementById("themeToggle");
  const root = document.documentElement;
  const applyTheme = (theme) => {
    // the two sky tiles cross-fade in CSS off [data-theme]; JS only keeps the
    // button's accessible state in sync
    root.setAttribute("data-theme", theme);
    const dusk = theme === "dusk";
    themeToggle.setAttribute("aria-pressed", String(dusk));
    themeToggle.setAttribute("aria-label", dusk ? "Switch to day theme" : "Switch to dusk theme");
  };
  const savedTheme = (() => {
    try { return localStorage.getItem("pk-theme"); } catch (e) { return null; }
  })();
  applyTheme(savedTheme === "dusk" ? "dusk" : "day");

  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dusk" ? "day" : "dusk";
    applyTheme(next);
    try { localStorage.setItem("pk-theme", next); } catch (e) { /* ignore */ }
  });

  /* ------------------------------------------------------------------
     9. Card tilt
     ------------------------------------------------------------------ */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".project-card, .skills-grid .card").forEach((card) => {
      // mousemove fires far more often than the screen refreshes, so cache the
      // rect on enter and write the transform at most once per frame
      let rect = null;
      let pending = false;
      let px = 0;
      let py = 0;

      const paint = () => {
        pending = false;
        if (!rect) return;
        const x = (px - rect.left) / rect.width - 0.5;
        const y = (py - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
      };

      card.addEventListener("mouseenter", () => { rect = card.getBoundingClientRect(); });
      card.addEventListener("mousemove", (e) => {
        px = e.clientX;
        py = e.clientY;
        if (pending) return;
        pending = true;
        requestAnimationFrame(paint);
      });
      card.addEventListener("mouseleave", () => {
        rect = null;
        card.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     10. Horizontal tracks (film strip + certificate reel) — drag to pan
     ------------------------------------------------------------------ */
  const makeDraggable = (track) => {
    if (!track) return;
    let down = false, startX = 0, startTx = 0, moved = 0;

    const currentX = () => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
    const minX = () => -Math.max(0, track.scrollWidth - window.innerWidth + 60);

    track.addEventListener("pointerdown", (e) => {
      down = true;
      moved = 0;
      startX = e.clientX;
      startTx = currentX();
      track.classList.add("dragging");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      const next = Math.max(minX(), Math.min(0, startTx + dx));
      track.style.transform = `translate3d(${next}px, 0, 0)`;
    });
    const endDrag = () => { down = false; track.classList.remove("dragging"); };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    // swallow the click that ends a drag so it doesn't open the lightbox
    track.addEventListener("click", (e) => {
      if (moved > 6) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  };

  makeDraggable(document.getElementById("reelTrack"));

  /* ------------------------------------------------------------------
     10b. Camera roll — a genuinely endless carousel

     The strip is cloned until it covers more than two viewports, then the
     offset wraps by exactly one set width. Because every set is identical,
     the wrap is invisible: the frame leaving on the left is the same one
     arriving on the right. Drift, drag and momentum all feed one offset.
     ------------------------------------------------------------------ */
  const filmTrack = document.getElementById("filmTrack");
  const filmStrip = document.getElementById("filmstrip");

  if (filmTrack && filmStrip && filmTrack.children.length) {
    const DRIFT = 26;                                  // px per second
    const originals = Array.from(filmTrack.children);
    let setWidth = 0;
    let offset = 0;
    let paused = false;
    let dragging = false;
    let pointerId = null;
    let lastPointerX = 0;
    let velocity = 0;
    let moved = 0;
    let rafId = null;
    let lastFrame = performance.now();

    const appendSet = () => {
      const frag = document.createDocumentFragment();
      originals.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.setAttribute("data-clone", "");
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("img").forEach((img) => { img.loading = "lazy"; });
        frag.appendChild(clone);
      });
      filmTrack.appendChild(frag);
    };

    // Read the repeat period straight off the layout: the distance from the
    // first frame to its first clone. Summing widths + gap by hand got this
    // wrong, because the frame width is a clamp() of the viewport.
    const measurePeriod = () => {
      const first = filmTrack.children[0];
      const firstClone = filmTrack.children[originals.length];
      if (!first || !firstClone) return 0;
      const d = firstClone.offsetLeft - first.offsetLeft;
      return isFinite(d) && d > 1 ? d : 0;
    };

    const rebuild = () => {
      filmTrack.querySelectorAll("[data-clone]").forEach((n) => n.remove());
      appendSet();
      setWidth = measurePeriod();
      if (!setWidth) return;

      // enough copies to always cover the viewport plus a set to wrap into
      const need = Math.ceil((window.innerWidth * 2) / setWidth) + 1;
      for (let c = 1; c < need; c++) appendSet();

      // keep the current position meaningful across a rebuild
      offset = -(((-offset % setWidth) + setWidth) % setWidth);
    };

    const wrap = () => {
      if (!setWidth) return;
      // Only at the moment of wrapping — roughly once per lap — re-read the
      // period. If anything changed the layout without us hearing about it,
      // this self-corrects on the next lap instead of jumping forever.
      if (offset <= -setWidth || offset > 0) {
        setWidth = measurePeriod() || setWidth;
        while (offset <= -setWidth) offset += setWidth;
        while (offset > 0) offset -= setWidth;
      }
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      if (dragging) {
        // position is driven by the pointer; nothing to integrate
      } else {
        if (Math.abs(velocity) > 1) {
          offset += velocity * dt;
          velocity *= 0.94;                            // friction after a flick
        } else {
          velocity = 0;
          if (!paused && !reduceMotion) offset -= DRIFT * dt;
        }
      }

      wrap();
      filmTrack.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
      rafId = requestAnimationFrame(frame);
    };

    /* --- drag --- */
    filmTrack.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = 0;
      velocity = 0;
      lastPointerX = e.clientX;
      pointerId = e.pointerId;
      filmTrack.setPointerCapture(pointerId);
      filmTrack.classList.add("dragging");
    });

    filmTrack.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastPointerX;
      lastPointerX = e.clientX;
      moved += Math.abs(dx);
      offset += dx;
      velocity = dx * 45;                              // carry the throw
      wrap();
      filmTrack.style.transform = `translate3d(${offset.toFixed(2)}px, 0, 0)`;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      filmTrack.classList.remove("dragging");
    };
    filmTrack.addEventListener("pointerup", endDrag);
    filmTrack.addEventListener("pointercancel", endDrag);

    // a drag must not open the lightbox
    filmTrack.addEventListener("click", (e) => {
      if (moved > 6) { e.stopPropagation(); e.preventDefault(); }
    }, true);

    /* --- pause while it is being looked at --- */
    filmStrip.addEventListener("pointerenter", () => { paused = true; });
    filmStrip.addEventListener("pointerleave", () => { paused = false; });

    /* --- only run while on screen --- */
    const start = () => {
      if (rafId) return;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = null;
    };

    rebuild();

    // The wrap distance has to match the live layout exactly — a stale value
    // makes the strip jump mid-loop. A ResizeObserver on one frame catches
    // every cause of a width change (viewport, zoom, font swap, late images),
    // not just the window resize event.
    if ("ResizeObserver" in window) {
      let lastFrameWidth = originals[0].getBoundingClientRect().width;
      const ro = new ResizeObserver(() => {
        const w = originals[0].getBoundingClientRect().width;
        if (Math.abs(w - lastFrameWidth) < 0.5) return;
        lastFrameWidth = w;
        rebuild();
      });
      ro.observe(originals[0]);
    }
    window.addEventListener("load", rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => entries.forEach((en) => (en.isIntersecting ? start() : stop())),
        { rootMargin: "200px 0px" }
      ).observe(filmStrip);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 180);
    });
  }

  /* ------------------------------------------------------------------
     11. Lightbox
     ------------------------------------------------------------------ */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxCaption = document.getElementById("lightboxCaption");

  const openLightbox = (src, alt, caption) => {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Preview";
    lightboxCaption.textContent = caption || "";
    lightbox.classList.add("open");
    document.body.classList.add("no-scroll");
    lenis?.stop();
  };
  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.classList.remove("no-scroll");
    lenis?.start();
  };

  document.querySelectorAll(".cert-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLightbox(btn.getAttribute("data-src"), btn.querySelector("img")?.alt);
    });
  });

  // delegated, because the carousel clones its frames to loop endlessly and
  // the clones would otherwise have no handler
  document.getElementById("filmstrip")?.addEventListener("click", (e) => {
    const frame = e.target.closest(".film-frame");
    if (!frame) return;
    openLightbox(
      frame.getAttribute("data-src"),
      frame.querySelector("img")?.alt,
      frame.querySelector("figcaption")?.textContent.trim()
    );
  });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  /* ------------------------------------------------------------------
     12. Back to top
     ------------------------------------------------------------------ */
  // visibility is handled by the shared scroll pass above
  totoroTop.addEventListener("click", () => scrollToTarget(0));

  /* ------------------------------------------------------------------
     13. Ambient particles
     ------------------------------------------------------------------ */
  const leafSVG = (color) =>
    `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12 2C6 2 2 8 2 14c4 0 8-2 10-6 0 5-3 9-8 10 2 1 4 1 6 1 6 0 10-6 10-13 0-1.5-.3-3-1-4-1.8 1.2-3.9 2-6 2z"/></svg>`;
  const leafColors = ["#7f9c53", "#5f8443", "#a8894a", "#4c7340"];

  const leavesContainer = document.getElementById("leaves");
  if (leavesContainer && !reduceMotion) {
    const LEAF_COUNT = window.innerWidth < 640 ? 5 : 11;
    for (let i = 0; i < LEAF_COUNT; i++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      leaf.innerHTML = leafSVG(leafColors[i % leafColors.length]);
      leaf.style.left = `${Math.random() * 100}%`;
      const size = 11 + Math.random() * 12;
      leaf.style.width = `${size}px`;
      leaf.style.height = `${size}px`;
      leaf.style.animationDuration = `${16 + Math.random() * 18}s`;
      leaf.style.animationDelay = `${Math.random() * -34}s`;
      leavesContainer.appendChild(leaf);
    }
  }

  const sootContainer = document.getElementById("soots");
  if (sootContainer && !reduceMotion) {
    [
      { top: "78%", left: "5%" },
      { top: "86%", left: "89%" },
      { top: "20%", left: "93%" },
      { top: "58%", left: "3%" },
    ].forEach((pos, i) => {
      const soot = document.createElement("div");
      soot.className = "soot";
      soot.style.top = pos.top;
      soot.style.left = pos.left;
      soot.style.animationDuration = `${3 + (i % 3)}s`;
      soot.style.animationDelay = `${i * 0.45}s`;
      soot.style.opacity = "0.4";
      sootContainer.appendChild(soot);
    });
  }
})();
