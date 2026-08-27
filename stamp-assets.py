"""
Stamp image URLs in index.html with a content hash (?v=abc12345).

Browsers cache images hard, so re-cropping a certificate does not change the
page unless the URL changes. Re-run this after replacing any image:

    python stamp-assets.py
"""
import hashlib
import io
import os
import re
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(ROOT, "index.html")

# only stamp things that get swapped out; wallpapers never change
STAMP = ("assets/portfolio-images/Certificate", "assets/photos/", "assets/web/")


def digest(rel_url):
    path = os.path.join(ROOT, urllib.parse.unquote(rel_url).replace("/", os.sep))
    if not os.path.isfile(path):
        return None
    with open(path, "rb") as fh:
        return hashlib.md5(fh.read()).hexdigest()[:8]


def main():
    html = io.open(HTML, encoding="utf-8").read()
    changed = []

    def repl(m):
        attr, url = m.group(1), m.group(2)
        base = url.split("?")[0]
        if not base.startswith(STAMP):
            return m.group(0)
        h = digest(base)
        if not h:
            print(f"  !! missing on disk: {base}")
            return m.group(0)
        new = f"{base}?v={h}"
        if new != url:
            changed.append(f"{base} -> ?v={h}")
        return f'{attr}="{new}"'

    html = re.sub(r'(src|data-src|data-bg)="([^"]+)"', repl, html)

    # The interlude bands are CSS background-image, not <img>, so they need
    # stamping too — otherwise swapping one of those pictures leaves every
    # returning visitor looking at the cached old one.
    def repl_css(m):
        url = m.group(1)
        base = url.split("?")[0]
        if not base.startswith(STAMP):
            return m.group(0)
        h = digest(base)
        if not h:
            print(f"  !! missing on disk: {base}")
            return m.group(0)
        new = f"{base}?v={h}"
        if new != url:
            changed.append(f"{base} -> ?v={h}")
        return f"url('{new}')"

    html = re.sub(r"url\('([^']+)'\)", repl_css, html)
    io.open(HTML, "w", encoding="utf-8", newline="\n").write(html)

    if changed:
        print(f"stamped {len(changed)} url(s):")
        for c in changed:
            print("  " + c)
    else:
        print("all image urls already current")


if __name__ == "__main__":
    main()
