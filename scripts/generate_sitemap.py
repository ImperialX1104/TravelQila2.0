#!/usr/bin/env python3
"""Generate the Travel Qila XML sitemap from canonical, indexable HTML pages.

Run from the repository root:
    python3 scripts/generate_sitemap.py

Only pages with a self-hosted canonical URL and no noindex robots directive
are included. The script intentionally does not invent lastmod timestamps.
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

SITE_ORIGIN = "https://travelqila.com"
REPO_ROOT = Path(__file__).resolve().parents[1]
SITEMAP_PATH = REPO_ROOT / "sitemap.xml"
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
ET.register_namespace("", NS)


class SEOHeadParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.canonical: str | None = None
        self.noindex = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): (value or "") for key, value in attrs}
        if tag.lower() == "link":
            rel = {part.lower() for part in attributes.get("rel", "").split()}
            href = attributes.get("href", "").strip()
            if "canonical" in rel and href:
                self.canonical = href
        elif tag.lower() == "meta" and attributes.get("name", "").lower() == "robots":
            directives = {part.strip().lower() for part in attributes.get("content", "").split(",")}
            if "noindex" in directives:
                self.noindex = True


def is_site_canonical(url: str) -> bool:
    parsed = urlparse(url)
    return (
        parsed.scheme == "https"
        and parsed.netloc.lower() == "travelqila.com"
        and bool(parsed.path or parsed.netloc)
        and not parsed.query
        and not parsed.fragment
    )


def collect_urls() -> list[str]:
    urls: set[str] = set()
    for html_file in REPO_ROOT.rglob("*.html"):
        if any(part.startswith(".") for part in html_file.relative_to(REPO_ROOT).parts):
            continue
        parser = SEOHeadParser()
        try:
            parser.feed(html_file.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError) as error:
            print(f"Skipping {html_file.relative_to(REPO_ROOT)}: {error}")
            continue
        if parser.noindex or not parser.canonical or not is_site_canonical(parser.canonical):
            continue
        urls.add(parser.canonical.rstrip("/") + "/" if parser.canonical == SITE_ORIGIN + "/" else parser.canonical)
    return sorted(urls)


def main() -> None:
    urls = collect_urls()
    if not urls:
        raise SystemExit("No canonical, indexable Travel Qila pages found; sitemap was not changed.")

    root = ET.Element(f"{{{NS}}}urlset")
    for url in urls:
        entry = ET.SubElement(root, f"{{{NS}}}url")
        ET.SubElement(entry, f"{{{NS}}}loc").text = url

    ET.indent(root, space="  ")
    xml = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8") + "\n"
    SITEMAP_PATH.write_text(xml, encoding="utf-8")
    print(f"Wrote {len(urls)} canonical, indexable URLs to {SITEMAP_PATH.name}")


if __name__ == "__main__":
    main()
