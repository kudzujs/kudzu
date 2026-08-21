# Apache Answer authentication ownership reduction

This fixture reduces Apache Answer's logged-user store, login page, request 401
handling, and protected settings route at
`3b9f1370612e690a0b7f230f05e688930db4c6d3` (Apache-2.0). One layout-owned
package-neutral session record replaces the broad Zustand graph; native storage,
fetch, form, navigation, and effect ownership preserve the user journey.
