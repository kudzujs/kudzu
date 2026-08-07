type Locale = "ko" | "en"

export function LocaleLink({ locale, href, children }: { locale: Locale, href: `/${string}`, children: unknown }) {
  const localizedHref = href === "/" ? `/${locale}` : `/${locale}${href}`
  return <a href={localizedHref}>{children}</a>
}
