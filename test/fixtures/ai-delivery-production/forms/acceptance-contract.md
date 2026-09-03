# Forms Acceptance Contract

This contract is framework-neutral. A result counts only when all behavior below passes against its pinned production build.

## Routes And Content

- `/` contains one `main`, one visible `h1` named "Create your Northstar account", and Account, Profile, and Preferences fieldsets.
- `/privacy/` contains complete privacy content and a native link back to signup.
- The signup page links natively to `/privacy/`.
- Kudzu's `/privacy/` output contains no module script, state marker, handler, effect, or runtime JavaScript.

## Existing Form Contract

- Email is required, uses `type="email"`, has a 254-character maximum, and uses email autocomplete.
- Password is required, uses `type="password"`, has 12- and 128-character length boundaries, requires at least one letter and one number, and uses new-password autocomplete.
- Full name is required with 2- and 80-character length boundaries and name autocomplete.
- Organization is optional with a 100-character maximum.
- Role is a required select with an unselected placeholder and individual contributor, manager, founder, and student options.
- Product updates are optional. Acceptance of the terms is required.
- Labels, legends, hint/error associations, and keyboard submission remain usable without custom keyboard handling.

## Requested Feature

- Account contains a labeled confirmation password control after the password control; its source `name` is not prescribed.
- It is required, has 12- and 128-character length boundaries, and uses `autocomplete="new-password"`.
- Empty or natively invalid input causes no `/api/accounts` request.
- Different password values cause no request, retain all entered values, focus confirmation, set `aria-invalid="true"`, and link the control to a visible alert explaining that passwords must match.
- A retry with matching passwords clears stale mismatch feedback before the request.

## Deterministic Server Boundary

- A valid submission sends exactly one `POST /api/accounts` request with the form as `FormData`.
- The acceptance server delays every response by 75 ms.
- `taken@example.com` returns `422` with `{ "errors": { "email": "An account already exists for this email." } }`.
- `unavailable@example.com` returns `503` with `{ "error": "Account service is temporarily unavailable." }`.
- Any other valid email returns `201` with `{ "accountId": "acct_benchmark_001" }`.
- A `422` response retains all values, focuses email, marks it invalid, and associates the exact field error.
- A `503` or transport failure retains all values and exposes an assertive form-level error.
- A `201` response exposes the polite status "Account created. Check your email to verify your address."
- While awaiting a response, the submit button is disabled and named "Creating account". Duplicate submissions create no additional request.

## Build And Dependency Rules

- `npm run build` exits successfully from each starter.
- Package resolutions remain pinned by the committed lockfile.
- No form library, schema validation package, or root-workspace dependency is added.
- Acceptance is evaluated independently; application code must not contain test-only shortcuts for the fixed emails or response timing.
