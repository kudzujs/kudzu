# Context action aliases

Consumer provenance: Actual Budget revision
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`,
`packages/desktop-client/src/components/accounts/Account.tsx:128,2002` selects
`dispatch: splitsExpandedDispatch` from `useSplitsExpanded()`. Its implementation
in `hooks/useSplitsExpanded.tsx:75` reads Context. This reduction isolates that
consumer alias boundary using the existing Notes Provider and direct Context
hook; it does not claim support for Actual's Set/reducer/useMemo provider.

The fixture renames state and CRUD actions, deliberately selects an action as
`setNotes` (the Provider's hidden setter), and occupies `__kContext_setNotes`.
The ordinary Context CRUD browser journey must still pass and its static sibling
must remain JavaScript-free.
