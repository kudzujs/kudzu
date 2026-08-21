# Apache Answer React Bootstrap layout reduction

This fixture reduces the `Row` and `Col` layout in Apache Answer's Questions
page at `3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). Both components
use only static `className` props and children; Bootstrap's `row` and `col`
classes carry their native layout semantics.
