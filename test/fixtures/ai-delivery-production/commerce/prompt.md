# Commerce derived-state task

The storefront is a compact production snapshot with option-derived image, price, and availability, a persistent cart, a checkout summary, responsive styling, and a static shipping route.

Add the one missing feature: show a live free-shipping message directly below the checkout subtotal. Free shipping starts at `100000` KRW. When the subtotal is below the threshold, render `N원 더 담으면 무료 배송` using the existing Korean number formatting, where `N` is the remaining amount. At or above the threshold, render `무료 배송이 적용되었습니다.`.

Keep the current routes, product behavior, storage key and cart schema, Korean copy, accessibility, and visual language. Use the framework's normal source model. Do not add dependencies, a server, network access, generated acceptance code, or a client router. `npm run build` must pass from this directory.
