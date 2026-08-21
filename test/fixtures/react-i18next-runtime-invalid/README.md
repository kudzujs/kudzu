# Apache Answer runtime translation boundary

This fixture preserves Apache Answer's Questions-page `useTranslation()` calls
at `3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). The values depend on
runtime-selected YAML/server resources, so Kudzu must direct migration toward
static locale routes and props rather than silently folding English or shipping
i18next.
