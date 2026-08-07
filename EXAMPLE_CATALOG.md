# Example Catalog Direction

## Goal

Build `/example` as a growing catalog of complete site examples without changing Kudzu's compiler or framework modules. The first catalog section is Blog; later sections can add portfolios, stores, dashboards, and other site types using the same layout.

## Boundaries

- Do not modify files under `framework/` or add framework APIs.
- Do not add a carousel dependency or client-side slider.
- Keep the catalog static so it ships no JavaScript.
- Use ordinary links for navigation when a complete example route exists.
- Do not publish dead links for examples that have not been implemented.

## Route Shape

```text
/example                    growing example catalog
/example/blog/<slug>        example showcase and source list
/example/blog/<slug>/demo   full-page example site
/example/blog/<slug>/demo/<post>  generated article page
```

The catalog does not need a route per category. Each category is a horizontal section on `/example`; this keeps discovery to one page and lets new categories be appended without changing navigation architecture.

## Catalog Layout

Each category consists of:

1. A category label and short description.
2. A horizontal rail of fixed-width cards, ordered left to right.
3. Native horizontal scrolling when cards exceed the viewport.
4. CSS scroll snapping for swiper-like stopping without JavaScript.

Desktop and mobile use the same interaction. Visible overflow at the right edge should make additional cards discoverable. Keyboard and trackpad scrolling remain native browser behavior.

## Card Content

Every card contains only the information needed to distinguish the example:

- type number;
- category label;
- example name;
- one-sentence description;

Each implemented card is an ordinary `<a>` to its showcase.

## Initial Blog Types

| Slug | Type | Focus |
|---|---|---|
| `personal` | Personal | essays, notes, and archives |
| `developer` | Developer | code, tags, and technical series |
| `editorial` | Editorial | magazine hierarchy and featured stories |
| `news` | News | headlines, categories, and recent coverage |
| `travel` | Travel | destinations, photography, and itineraries |
| `recipe` | Recipe | ingredients, steps, and cooking metadata |
| `lifestyle` | Lifestyle | visual stories, products, and trends |
| `photography` | Photography | image-led albums and photo essays |
| `reviews` | Reviews | books, films, ratings, and commentary |
| `company` | Company | expertise, announcements, and calls to action |
| `changelog` | Product Updates | releases, versions, and change history |
| `tutorial` | Education | lessons, series, and step-by-step guides |
| `portfolio-journal` | Portfolio Journal | project process, outcomes, and retrospectives |
| `minimal` | Minimal Journal | short writing with restrained navigation |
| `newsletter` | Newsletter | issue-based publishing and subscriptions |
| `community` | Community | multiple authors, topics, and popular posts |

## Growth Rule

Catalog content lives as plain data and is rendered by one category section. Adding another blog type means adding one data item. Adding another category means adding one section with its own items. Do not add registries, loaders, or generalized routing until a second category or a working showcase requires them.

## Showcase Direction

`/example/blog/<slug>` contains:

- an isolated live preview of `/example/blog/<slug>/demo`;
- an ordinary link to open the full demo;
- a directory tree linked to source sections;
- syntax-highlighted files using the existing `CodeBlock` component.

The source panel is a concise, reproducible starter rather than a dump of the catalog's internal renderer. This keeps each example useful as project code while the shared catalog stays maintainable.

## Acceptance Criteria

- `/example` renders all initial blog types in one left-to-right card rail.
- The rail scrolls horizontally instead of wrapping.
- Scroll snapping works without JavaScript or a dependency.
- Cards remain readable and operable on desktop and mobile.
- Existing home and docs routes keep their current behavior.
- `framework/` remains unchanged.
- `npm run check` and `npm test` pass.
