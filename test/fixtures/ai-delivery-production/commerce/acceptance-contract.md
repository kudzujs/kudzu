# Commerce acceptance contract

- `npm ci && npm run build` succeeds with the committed lockfile on Node 22 or newer and no dependency change.
- Product, checkout, and shipping routes remain directly addressable.
- Color and size controls retain accessible group names and pressed states.
- The selected color and size derive the image, price, availability, and add-button disabled state.
- Available selections persist under `otw-cart` and restore in checkout after navigation or reload.
- Checkout retains line title, options, quantity, line total, subtotal, and empty-cart behavior.
- Exactly one free-shipping message appears directly below the subtotal.
- Subtotals `0`, `89000`, and `100000` produce `100,000원 더 담으면 무료 배송`, `11,000원 더 담으면 무료 배송`, and `무료 배송이 적용되었습니다.` respectively.
- Kudzu's shipping route remains complete static HTML with zero browser JavaScript.
- No hard-coded single-case result, duplicate cart source, console error, failed asset, added runtime, dependency, server, or client router is accepted.
