# THRM SortableJS Lifecycle Reduction

- Upstream: `TIANLI0/THRM`
- Revision: `f1c0294467dcb0478b7c5cef185630fcd1dd5d27`
- Source: `frontend/src/app/components/DeviceStatus.tsx`
- Source SHA-256: `49f47d518290fdac581db00aca55b9978866306fc0b828ef93481df934b584eb`
- Package manifest SHA-256: `1b08a854ab6150e1ba25e2f2446521d2480fd2dc4fe966c3de2af683c647cbae`
- Application license: MIT
- Package: `sortablejs@1.15.7`, MIT

The upstream component creates SortableJS only while sorting mode is active.
SortableJS transiently moves existing card nodes during a drag. Its `onEnd`
callback restores the authored DOM order before immutable state performs the
durable keyed reorder, and effect cleanup destroys the package instance.

The direct reduction first failed because the lexical binding index treated the
native `HTMLElement` constructor used by the upstream child filter as a capture.
Kudzu now classifies that unshadowed browser constructor like `Event`, `FormData`,
and `IntersectionObserver`; local or parameter shadowing remains lexical.

The browser journey proves package-backed reorder, retained keyed DOM/input/focus
identity, keyboard-equivalent reorder and reset, invalid-item recovery, exact
conditional/document disposal, fresh remount, and static package exclusion. One
list owns durable DOM order at every commit; concurrent external mutation and
cross-list dragging remain outside this fixture.
