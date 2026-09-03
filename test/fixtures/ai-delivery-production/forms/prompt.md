# Account Signup Task

Complete the supplied account signup application by adding a **Confirm password** field to the Account section.

## Requirements

- Keep the existing visual design, sections, fields, native constraints, server request, server-error handling, and privacy route.
- The confirmation field must be required, use the appropriate password input and autocomplete semantics, and enforce the same length boundary as the password field.
- Prevent submission when the password values differ. Show a clear inline mismatch error, expose it to assistive technology, associate it with the confirmation control, mark that control invalid, and move focus to it.
- Clear stale mismatch feedback when the user retries with matching values.
- Preserve every entered value when client or server validation fails.
- Keep the pending state resistant to duplicate submission and keep the existing accessible success and failure status behavior.
- Submit the existing `FormData` request only after native and password-match validation succeeds.
- Do not add a form library or change the deterministic server contract.
- Keep the source ordinary, maintainable TypeScript and TSX rather than introducing benchmark-specific imperative DOM code.

The completed project must build with `npm run build`.
