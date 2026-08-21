# Apache Answer browser Questions data reduction

This fixture reduces Apache Answer's Questions page and
`services/client/question.ts` at
`3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). SWR, axios, and `qs`
are replaced by one owned native fetch effect while the authored page/order URL
semantics, loading/error/data states, recommendation endpoint, and keyed question
rows remain.
