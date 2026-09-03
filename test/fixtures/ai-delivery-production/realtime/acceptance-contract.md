# Realtime memo ownership acceptance contract

The Kudzu and React + Vite starters use this same contract. Acceptance is intentionally specified but not executable in the starter packet.

## Build and output

- `npm ci` and `npm run build` succeed from each isolated starter.
- Dependencies resolve only from that starter's pinned lockfile; neither starter reads repository-root dependencies.
- The production feed is available at `/` and the static About document at `/about/`.
- Kudzu's `/about/` output contains meaningful HTML and no script, module preload, state marker, or realtime artifact reference.
- No framework may remove feed content, accessibility, fake-transport behavior, cleanup, or error handling to reduce output.

## Initial application

- The shell exposes a Skip to feed link, product navigation, account context, one `h1`, and a named feed region.
- Three deterministic seeded memos render before JavaScript, ordered newest first, with stable `data-memo-id` identities.
- The connection status is a polite live region and progresses from `connecting` to `connected` after the fake socket opens.
- The browser has one active fake socket with exactly three listeners: `open`, `message`, and `close`.

## Existing realtime behavior

- A version 2 snapshot updates the matching keyed memo and appends one memo without replacing retained memo DOM nodes.
- Replaying version 2 and sending version 1 make no DOM change.
- Dropping the current socket changes status to `reconnecting`, removes all listeners from that socket, and creates exactly one replacement after 80 ms.
- An event sent to the released socket after replacement is ignored, including an event with a greater version than the current snapshot.
- The replacement socket accepts the next newer version and leaves the stale socket closed and listener-free.
- Leaving the feed through its owner-removal control closes the current socket exactly once, removes all listeners, cancels pending reconnect work, and changes no feed state through late events.
- Re-entering the feed starts exactly one fresh socket and the seeded feed starts with fresh owner state.

## Requested pause/resume behavior

- The completed task adds one native button whose accessible name is `Pause live updates` while active and `Resume live updates` while paused.
- Pausing does not remove or replace the feed region or any rendered memo node.
- Pausing closes the active socket exactly once, removes all three listeners, cancels a pending reconnect if present, and announces `paused` in the existing polite status.
- Any late open, message, or close event from a pre-pause socket is ignored and creates no reconnect.
- Resuming creates exactly one fresh socket, returns through `connecting` to `connected`, and accepts only snapshots newer than the last accepted version.
- Five pause/resume cycles leave at most one active socket, one three-listener set, and one reconnect timer; final owner removal returns all three counts to zero.

## Accessibility and integrity

- Navigation and owner-removal controls are keyboard operable and retain visible focus treatment.
- Connection changes use the existing `role="status"` live region; no duplicate live region is added.
- Memo timestamps use `time` elements with deterministic `dateTime` values.
- Browser execution reports no uncaught exception or failed local asset request.
- The implementation remains ordinary maintainable source for its framework and does not edit generated output.
