import { DocsHeader, DocsIntro, DocsSidebar } from "../components/docs/DocsLayout"
import { AttributesSection, ComponentsSection, InstallationSection, PagesSection, StateSection } from "../components/docs/GuideSections"
import { CapturesSection, ConditionalsSection, EventsSection, ListsSection } from "../components/docs/InteractiveSections"
import { BenchmarksSection, BuildSection, LimitsSection } from "../components/docs/ReferenceSections"

export const metadata = {
  title: "Kudzu Docs — HTML-first TSX",
  description: "Kudzu installation, components, state semantics, application navigation, effects, performance, and build reference.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu",
  url: "https://kudzujs.cloud/docs/",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu HTML-first TSX framework documentation",
  themeColor: "#8d52ff",
  icon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  manifest: "/site.webmanifest"
}

export default function DocsPage() {
  return <>
    <DocsHeader />
    <div className="docs-layout">
      <DocsSidebar />
      <main className="docs-content">
        <DocsIntro />
        <InstallationSection />
        <PagesSection />
        <ComponentsSection />
        <StateSection />
        <AttributesSection />
        <ConditionalsSection />
        <ListsSection />
        <EventsSection />
        <CapturesSection />
        <BuildSection />
        <BenchmarksSection />
        <LimitsSection />
      </main>
    </div>
  </>
}
