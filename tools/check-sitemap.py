#!/usr/bin/env python3
"""Guard: sitemap must have no duplicate <loc>, a <lastmod> per url, a real file
behind every loc, and must agree with the pages' canonical tags in both
directions. Exits non-zero on any violation. Run from the repo root."""
import glob, pathlib, re, sys, xml.dom.minidom

fail = []
sm = pathlib.Path("sitemap.xml").read_text()
try:
    xml.dom.minidom.parseString(sm)
except Exception as e:
    print(f"FAIL sitemap.xml is not valid XML: {e}"); sys.exit(1)

locs = re.findall(r"<loc>(.*?)</loc>", sm)
dupes = sorted({l for l in locs if locs.count(l) > 1})
if dupes:
    fail.append("duplicate <loc> entries:\n  " + "\n  ".join(dupes))
if sm.count("<lastmod>") != len(locs):
    fail.append(f"{len(locs)} <loc> but {sm.count('<lastmod>')} <lastmod>")

for l in set(locs):
    rel = l.replace("https://title-22.com/", "")
    f = (rel + "index.html") if rel else "index.html"
    if not pathlib.Path(f).exists():
        fail.append(f"no file behind {l} (expected {f})")

canon = set()
for f in glob.glob("**/*.html", recursive=True):
    m = re.search(r'<link rel="canonical" href="(.*?)"', pathlib.Path(f).read_text())
    if m: canon.add(m.group(1))
missing = sorted(set(locs) - canon)
extra = sorted(canon - set(locs))
if missing: fail.append("in sitemap but no canonical: " + ", ".join(missing))
if extra:   fail.append("canonical but not in sitemap: " + ", ".join(extra))

if fail:
    print("SITEMAP CHECK FAILED\n" + "\n".join("- " + f for f in fail)); sys.exit(1)
print(f"sitemap OK: {len(locs)} locs, no duplicates, lastmod on all, canonicals agree")
