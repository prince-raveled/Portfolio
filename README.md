# Prince Kumar — Portfolio

A Ghibli-inspired resume site. Static HTML/CSS/JS, no build step.

**Live:** _(add the Vercel URL once deployed)_

## Structure

```
index.html            the whole page
css/style.css         layout, type, components, day/dusk themes
css/atmosphere.css    sky, wind, grass, dust — the decorative layer
js/script.js          scroll motion, reveals, lightbox, theme toggle
js/atmosphere.js      wind gusts, grass generation, dust motes
assets/photos/        optimised photography + portrait + toggle tiles
assets/web/           optimised backgrounds and project thumbnails
assets/portfolio-images/  source art and certificates
stamp-assets.py       cache-busting helper (see below)
```

Motion comes from [Lenis](https://lenis.darkroom.engineering/) (smooth scroll) and
[GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/), both loaded
from a CDN. If either fails to load the page falls back to IntersectionObserver
reveals, and everything decorative is disabled under `prefers-reduced-motion`.

## Running it locally

Any static server works:

```bash
python -m http.server 5174
```

Then open <http://localhost:5174>.

## After replacing an image

Browsers cache images hard, so a re-cropped file will not show up until its URL
changes. `stamp-assets.py` appends a content hash (`?v=abc12345`) to every
swappable image URL in `index.html`:

```bash
python stamp-assets.py
```

Run it after replacing anything in `assets/photos/`, `assets/web/`, or any
`Certificate (n).png`, then commit the updated `index.html`.

## Notes

- Raw camera originals are gitignored (see `.gitignore`) — the site serves the
  optimised copies. Page payload is ~3.9 MB.
- Deployed on Vercel as a static site; `vercel.json` sets cache and security
  headers.
