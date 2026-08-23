import { CodeBlock } from "../CodeBlock"

export function InstallationSection() {
  return <section className="docs-section" id="install">
    <div className="docs-heading"><span>01</span><div><p>GETTING STARTED</p><h2>Installation</h2></div></div>
    <p>Kudzu requires Node.js 22 or newer. Create a project and start the development server:</p>
    <CodeBlock language="shell" code={`npm create kudzu@latest my-app
cd my-app
npm install
npm run dev`} />
    <p>To add Kudzu to an existing project, install <code>@kudzujs/core</code> and <code>typescript</code>, configure TypeScript with <code>jsxImportSource: "@kudzujs/core"</code>, and add these scripts to <code>package.json</code>:</p>
    <CodeBlock language="shell" code={`npm install @kudzujs/core@^0.12.0 typescript`} />
    <CodeBlock language="text" code={`{
  "scripts": {
    "dev": "kudzu dev",
    "build": "kudzu build",
    "check": "tsc --noEmit && kudzu build"
  }
}`} />
  </section>
}

export function PagesSection() {
  return <section className="docs-section" id="pages">
    <div className="docs-heading"><span>02</span><div><p>GETTING STARTED</p><h2>Pages & routes</h2></div></div>
    <p>Every TSX file in <code>src/pages</code> becomes static HTML in <code>dist</code>.</p>
    <div className="docs-table">
      <code>src/pages/index.tsx</code><span>→</span><code>/</code>
      <code>src/pages/docs.tsx</code><span>→</span><code>/docs</code>
      <code>src/pages/blog/index.tsx</code><span>→</span><code>/blog</code>
    </div>
    <p>Bracket parameters use <code>getStaticPaths()</code> to emit multiple static pages with build-time props.</p>
    <CodeBlock code={`// src/pages/posts/[slug].tsx
export async function getStaticPaths() {
  return [
    { params: { slug: "oak" }, props: { title: "Oak" } },
    { params: { slug: "pine" }, props: { title: "Pine" } }
  ]
}

export default function Post({ title }: { title: string }) {
  return <h1>{title}</h1>
}`} />
    <p>Missing params, unsafe path segments, and duplicate output routes fail the build. Catch-all parameters are not yet supported.</p>
    <h3>Runtime parameters</h3>
    <p>When a bracket value exists only in the request URL, export <code>runtimeParams = true</code> and read it with <code>useParams()</code>. Kudzu emits one static fallback document and a route-specific pathname matcher, not a client router.</p>
    <CodeBlock code={`// src/pages/items/[id].tsx
import { useEffect, useParams } from "@kudzujs/core"

export const runtimeParams = true

export default function ItemPage() {
  const { id } = useParams<{ id: string }>()
  useEffect(() => {
    fetch(\`/api/items/\${encodeURIComponent(id)}\`)
  }, [])
  return <h1>Item {id}</h1>
}`} />
    <p><code>getStaticPaths()</code> and <code>runtimeParams</code> are mutually exclusive. Parameters occupy complete path segments and malformed, separator, control, and traversal-like values are rejected. Static hosts must try exact files first and then internally rewrite matching paths to the generated fallback while preserving the URL. Ordered rewrite metadata is available to <code>afterBuild()</code>.</p>
    <p>Migration input may retain a named or aliased <code>useParams</code> import from <code>react-router-dom</code> in this runtime route shape. Kudzu redirects a direct zero-argument call to the same pathname reader and removes the router package import. New Kudzu source should continue importing <code>useParams</code> from <code>@kudzujs/core</code>. Build-known <code>getStaticPaths()</code> routes receive their values through page props instead.</p>
    <p>A named or aliased React Router <code>useMatch</code> may directly initialize one top-level <code>const</code> from an exact static root-relative string such as <code>useMatch(&quot;/&quot;)</code> in route scope. Kudzu evaluates it case-insensitively from each build-known application route, so a reused component can select route-specific static output without a browser router or JavaScript. Layout use, runtime-parameter pages, params, wildcards, query/hash patterns, trailing slashes, dynamic patterns, and indirect calls remain unsupported.</p>
    <h3>Query parameters</h3>
    <p>Migration source may retain a named or aliased React Router <code>useSearchParams</code> call. One top-level tuple binding and direct static <code>get()</code> locals become nullable route signals backed by a minimal <code>URLSearchParams</code> capability. The exact pagination form <code>Number(params.get("page")) || 1</code> and a string fallback from a static element of a named relative immutable array reuse that signal and the primitive binding evaluator. An optional setter accepts direct inline updater calls from browser callbacks.</p>
    <CodeBlock code={`import { useSearchParams } from "react-router-dom"

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q")
  return <button data-query={query} onClick={() => setSearchParams(previous => {
    const next = new URLSearchParams(previous)
    next.set("q", "next")
    return next
  }, { replace: true })}>{query}</button>
}`} />
    <p>The static fallback renders missing query values as blank text and omits nullable attributes. Browser initialization uses native decoding semantics before route effects mount. Setter calls without options use <code>history.pushState()</code>; exactly <code>{`{ replace: true }`}</code> uses <code>history.replaceState()</code>. Both recommit query signals immediately, and browser back/forward follows <code>popstate</code>. Dynamic names or indexes, direct-value setters, other options, <code>getAll</code>, <code>has</code>, aliases, broader fallback expressions, and indirect reads are rejected. Routes without query reads or writes emit no parameter module.</p>
    <h3>React Bootstrap layout</h3>
    <p>Migration source may retain named or aliased React Bootstrap <code>Row</code> and <code>Col</code> elements with children, a static <code>className</code>, and numeric literal <code>Col</code> spans from 1 through 12 for <code>xs</code> through <code>xxl</code>. Kudzu emits native Bootstrap grid markup with no browser JavaScript. Keep Bootstrap CSS reachable from the route; boolean/object/dynamic grid props, dynamic classes, spreads, and other React Bootstrap components remain unsupported.</p>
    <h3 id="navigation">Application navigation</h3>
    <p>Native anchors are the default. Migration input may retain a named or aliased React Router <code>Link</code> when <code>to</code> is one static root-relative path; Kudzu applies the configured base, emits an ordinary anchor, and removes the package import.</p>
    <CodeBlock code={`import { Link as RouterLink } from "react-router-dom"

<RouterLink to="/products?sort=name#results" className="nav-link">
  Products
</RouterLink>

// With base: "/app", emits:
// <a href="/app/products?sort=name#results" class="nav-link">Products</a>`} />
    <p>Dynamic or relative destinations, <code>NavLink</code>, router-only props, spreads, default or namespace imports, and non-JSX uses are rejected rather than approximating React Router semantics. Ordinary authored <code>&lt;a href&gt;</code> values remain unchanged.</p>
    <p>Imperative migration source may use one top-level named or aliased <code>useNavigate()</code> binding. Direct calls inside browser callbacks lower to native document navigation after Kudzu applies the configured base.</p>
    <CodeBlock code={`import { useNavigate } from "react-router-dom"

export function CheckoutButton() {
  const navigate = useNavigate()
  return <button onClick={() => navigate("/checkout")}>Checkout</button>
}`} />
    <p>A one-argument call uses <code>location.assign()</code>; exactly <code>{`{ replace: true }`}</code> uses <code>location.replace()</code>. Destinations must be safe static root-relative strings. Dynamic and relative destinations, render-time calls, passed aliases, and other options are rejected. This remains native document navigation rather than an SPA router.</p>
    <p>Emitted exact and runtime-parameter routes may share a page-exported layout and opt into same-document navigation while every URL remains a complete standalone document.</p>
    <CodeBlock code={`// src/pages/product.tsx
export { Shell as layout } from "../components/Shell"

export default function ProductPage() {
  return <main><h1>Product</h1></main>
}

// kudzu.config.mjs
export default {
  navigation: { routes: ["/product", "/items/[id]"] }
}`} />
    <CodeBlock code={`// Multiple shared layouts (mutually exclusive with routes)
export default {
  navigation: { groups: [
    { routes: ["/product", "/items/[id]"] },
    { routes: ["/account", "/settings"] }
  ] }
}`} />
    <p>Every configured pattern must identify a globally unique emitted route. A runtime route uses its bracket pattern, such as <code>/items/[id]</code>. Each group uses one page-exported layout identity, while different groups may use different layouts. Kudzu emits one deterministic route-hashed, capability-specialized asset per group and rejects overlapping path domains across groups. Layout DOM, state, and effects persist within a group; route state, parameters, effects, and DOM-owner records reset after cleanup. Conditional and keyed effects follow those layout or route lifetimes, with fresh route records and item-property subscriptions on cached revisits. Eligible same-group anchors prefetch validated complete documents. Cross-group links, direct loads, reloads, failures, malformed paths, unsupported links, and ungrouped routes keep native document navigation. Coordinated exit/shared-element View Transitions are not supported.</p>
    <h3>Project configuration</h3>
    <CodeBlock code={`// kudzu.config.mjs
export default {
  base: "/newsletter",
  publicDir: "../public",
  styles: [{ source: "../src/styles/global.css", output: "/assets/styles.css", transform: css => transformCss(css) }],
  metadata: ({ props }) => ({ lang: props.locale, manifest: "/manifest.json" }),
  async afterBuild({ outDir, routes, plans, rewrites, base }) {
    // Write host rewrites, RSS, sitemap, or search indexes.
  }
}`} />
    <p>The base prefixes runtime, handler, stylesheet, icon, manifest, lowered React Router <code>Link</code>, and dev-server URLs without nesting files under <code>dist</code>. Ordinary authored anchor URLs remain under application control. Relative source CSS imports follow each page's reachable TypeScript import and re-export graph, emit under <code>dist/assets</code>, and link only from those routes in deterministic order. Declare truly global styles through <code>kudzu.config styles</code>. Enhanced navigation loads destination CSS before replacing route DOM, retains shared layout links, and removes outgoing route links. Source style entries may transform CSS before writing their declared output. <code>publicDir</code> defaults to <code>public</code>. Config and page metadata may be objects or functions of route props; page metadata wins. Reserve <code>afterBuild()</code> for host rewrites and extra artifacts rather than HTML or stylesheet mutation. Page JSX must not render body stylesheets.</p>
    <h3>Trusted HTML</h3>
    <CodeBlock code={`<article dangerouslySetInnerHTML={{ __html: renderedNotionHtml }} />`} />
    <p>Raw HTML is not sanitized. It accepts trusted build-time content only; reactive values, children on the same element, void elements, and keyed-list raw HTML are rejected.</p>
  </section>
}

export function ComponentsSection() {
  return <section className="docs-section" id="components">
    <div className="docs-heading"><span>03</span><div><p>CORE</p><h2>Components</h2></div></div>
    <p>Ordinary common React-shaped TSX should migrate with minimal source restructuring. Use familiar function components, props, children, fragments, collections, hooks, and conditions; Kudzu prefers compiler specialization over imperative DOM rewrites. This product direction is not specific to one migrated application. Components run at build time and do not remain as a browser-side tree.</p>
    <p>Migration source may retain conventional <code>react</code> imports for supported named or aliased hooks, direct members such as <code>React.useState</code>, same-file <code>memo</code>, inline <code>useCallback</code>, primitive/direct-state expression or analyzable collection-pipeline <code>useMemo</code>, direct intrinsic <code>forwardRef</code>, top-level <code>const</code> identifiers initialized by <code>useId()</code>, and default, namespace, or named <code>Fragment</code>. A named or default zero-argument custom hook imported from a relative TypeScript module may expose direct shorthand <code>useState</code> value/setter pairs and callbacks that capture those states, including direct multi-state literal reset actions; the caller uses one top-level <code>const</code> object destructuring without aliases, defaults, or rest. One relative <code>useDebounce(state, literalDelay)</code> shape may instead return a primitive state directly when its single timeout dependency effect has exact cleanup. A direct React <code>createRef()</code> may attach once to an intrinsic element and enter one relative outside-click hook with an inline literal setter callback and matching document-listener cleanup. A supported <code>forwardRef</code> uses one inline synchronous <code>(props, ref)</code> function and forwards the object ref exactly once to its direct intrinsic root; Kudzu removes <code>ref</code> from props/rest and erases the wrapper. Kudzu turns <code>useId()</code> into a deterministic static HTML ID with no browser capability; keyed rows reject it to prevent cloned templates from duplicating IDs. Collection memos may start from local array state or a named relative import of an exported JSON-safe <code>const</code> array and filter by declared direct local-state dependencies. One direct array field from a top-level relative calculation result may also feed a keyed intrinsic map; route binding ESM refreshes the existing keyed list path after source-state commits. Kudzu canonicalizes these forms before evaluation; memo wrappers become build-time components, callbacks, direct bindings, or keyed-list selectors rather than a browser cache. React is not loaded or emitted, and a static route remains JavaScript-free.</p>
    <p>Structural keyed rows over compiler-owned static filters use a route-specific fast path: source items and keys validate once, retained rows never move, and filtered rows restore as fresh clones of detached prototypes. The historical 0.7.8 matched snapshot measured Kudzu at 8.4 ms to filter and 3.6 ms to restore under 4x CPU throttling; its local runner and raw arrays are not tracked in this repository. Large datasets should still be paginated or windowed rather than rendered as 100,000 or 1,000,000 DOM nodes.</p>
    <CodeBlock code={`function Greeting({ name }: { name: string }) {
  return <h1>Hello {name}</h1>
}

export default function Page() {
  return <Greeting name="Kudzu" />
}`} />
    <h3>Native dialog migration</h3>
    <p>React UI packages that depend on portals or a retained Context tree do not run in Kudzu. Migrate the used component boundary to a relative component backed by the native platform instead. A shadcn/Radix-shaped dialog can retain <code>forwardRef</code>, props, children, object refs, and ordinary handlers while replacing the package-owned Portal and Context with <code>&lt;dialog&gt;</code>.</p>
    <CodeBlock code={`type Props = {
  "aria-describedby": string
  "aria-labelledby": string
  children?: unknown
  onCancel: (event: Event) => void
}

const DialogContent = forwardRef<HTMLDialogElement, Props>(
  ({ children, ...props }, ref) => <dialog {...props} ref={ref}>{children}</dialog>
)

function ProfileDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return <>
    <button ref={triggerRef} onClick={() => dialogRef.current?.showModal()}>Open</button>
    <DialogContent ref={dialogRef} aria-labelledby="profile-title" aria-describedby="profile-description" onCancel={event => {
      event.preventDefault()
      dialogRef.current?.close()
      triggerRef.current?.focus()
    }}>
      <h2 id="profile-title">Edit profile</h2>
      <p id="profile-description">Update your public profile.</p>
      <button onClick={() => {
        dialogRef.current?.close()
        triggerRef.current?.focus()
      }}>Close</button>
    </DialogContent>
  </>
}`} />
    <p>Kudzu emits the complete dialog HTML and only the route's native event handlers. The application must preserve labeling and focus restoration as shown. Radix package execution, <code>Portal</code>, <code>asChild</code>/<code>Slot</code>, element cloning, and arbitrary compound-component Context remain unsupported; this is a source migration recipe, not package compatibility.</p>
    <h3>Native form migration</h3>
    <p>React Hook Form does not run in Kudzu. For ordinary forms, migrate its registration and submit wrapper to native controls, constraint validation, and one direct submit handler. Keep uncontrolled field values in the DOM and reserve application state for submitting, server errors, and success feedback.</p>
    <CodeBlock code={`const [status, setStatus] = useState("idle")

async function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
  event.preventDefault()
  const email = String(new FormData(event.currentTarget).get("email") ?? "")

  setStatus("submitting")
  const response = await createAccount(email)
  setStatus(response.ok ? "success" : "error")
}

return <form onSubmit={submit}>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    name="email"
    type="email"
    required
    aria-invalid={status === "error" ? "true" : "false"}
    aria-describedby={status === "error" ? "signup-error" : undefined}
  />
  <button disabled={status === "submitting"}>Create account</button>
  {status === "error" && <p id="signup-error" role="alert">Email already registered.</p>}
</form>`} />
    <p>Read <code>event.currentTarget</code> and construct <code>FormData</code> before the first <code>await</code>. Native <code>required</code>, input types, lengths, and patterns handle synchronous field validity without input listeners. Kudzu emits complete form HTML, one route-specific submit handler, and only the bindings and conditional feedback used. <code>useForm</code>, <code>register</code> spreads, <code>handleSubmit</code>, <code>Controller</code>, watchers, resolver packages, dirty/touched proxies, and dynamic field registration remain source migration work rather than supported React Hook Form runtime APIs.</p>
    <h3>Data-fetching library migration</h3>
    <p>TanStack Query does not run in Kudzu. Classify each read by when its inputs exist. Build-known data belongs in an async page or component and becomes complete zero-JavaScript HTML. Data available only in the browser belongs in an inline effect with application-owned loading, error, and result state.</p>
    <CodeBlock code={`// Build-known data
export default async function ProductsPage() {
  const products = await loadProducts()
  return <ul>{products.map(product => <li key={product.id}>{product.name}</li>)}</ul>
}

// Browser-only data
const [request, setRequest] = useState(0)
const [status, setStatus] = useState("loading")
const [products, setProducts] = useState([])

useEffect(() => {
  setStatus("loading")
  void fetch("/api/products?request=" + request)
    .then(response => response.json())
    .then(next => {
      setProducts(next)
      setStatus("success")
    })
}, [request])

return <button onClick={() => setRequest(request + 1)}>Refetch</button>`} />
    <p>Dependency replacement invalidates the previous effect invocation before cleanup, so late promise or fetch setters cannot overwrite newer state. A primitive request counter provides explicit refetch without a query runtime. Applications still own HTTP error handling and cleanup for imperative resources. Query clients, Providers, caches, retries, deduplication, optimistic cache updates, query-key arrays, Suspense, and background refetch remain source migration work.</p>
    <h3>Icon library migration</h3>
    <p>React icon packages such as Lucide do not run during Kudzu rendering. Move only the icons an application uses into small relative TSX components with direct SVG roots. Familiar props remain ordinary component inputs and React-shaped SVG attributes normalize to native output.</p>
    <CodeBlock code={`function SearchIcon({ title, ...iconProps }: IconProps) {
  return <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...iconProps}
  >
    {title && <title>{title}</title>}
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
}

return <>
  <SearchIcon role="img" title="Search catalog" />
  <CheckIcon aria-hidden={true} />
</>`} />
    <p>Meaningful icons need an explicit accessible name, while decorative icons should remain hidden from assistive technology. Kudzu emits the used SVG markup directly into complete HTML, removes build-folded evaluator artifacts, and never compiles unreachable icon modules. <code>lucide-react</code> execution, <code>createLucideIcon()</code>, dynamic icon-name lookup, package factories, and a generic icon runtime remain unsupported.</p>
    <h3>Scroll-spy migration</h3>
    <p>A Memos-shaped outline can keep its ordinary effect-owned animation-frame ref. Kudzu moves the exclusive <code>useRef(0)</code> value into the effect invocation closure rather than serializing it or shipping an animation runtime.</p>
    <CodeBlock code={`const [activeSlug, setActiveSlug] = useState<string | null>(null)
const rafRef = useRef(0)

useEffect(() => {
  const update = () => {
    rafRef.current = 0
    const active = headings.findLast(heading =>
      document.getElementById(heading.slug)!.getBoundingClientRect().top <= 100
    )
    setActiveSlug(active?.slug ?? null)
  }
  const requestUpdate = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(update)
  }

  update()
  window.addEventListener("scroll", requestUpdate, true)
  return () => {
    window.removeEventListener("scroll", requestUpdate, true)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }
}, [])`} />
    <p>The frame callback must directly reset the ref, one scheduler must assign the request, and cleanup must cancel any pending frame. Ref aliases, nonzero initializers, use across effects or handlers, repeated scheduling assignments, and missing cancellation remain unsupported. Static sibling routes still ship zero JavaScript.</p>
    <h3>Canvas animation migration</h3>
    <p>A continuous canvas animation can remain ordinary React-shaped source when one effect owns the browser resource. Local effect variables replace component-level mutable refs, while the canvas itself keeps a direct object ref.</p>
    <CodeBlock code={`const canvasRef = useRef<HTMLCanvasElement>(null)

useEffect(() => {
  const canvas = canvasRef.current
  const context = canvas?.getContext("2d")
  if (!canvas || !context) return
  let frame = 0
  let visible = true
  let x = 20

  const tick = () => {
    if (visible) context.fillRect(x, 30, 20, 20)
    frame = requestAnimationFrame(tick)
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  })
  const move = () => { x += 8 }

  observer.observe(canvas)
  window.addEventListener("keydown", move)
  frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    window.removeEventListener("keydown", move)
  }
}, [])`} />
    <p>Kudzu emits one route-specific effect module and preserves native <code>IntersectionObserver</code>, <code>performance</code>, canvas, and frame APIs directly. Component-level mutable value refs, callbacks shared across effects or JSX handlers, uncancelled loops, and missing observer/listener cleanup remain unsupported.</p>
    <h3>Localized MDX migration</h3>
    <p>A static locale pair can retain automatic browser-language entry and automatically prefixed links without shipping a package router. Each article route is build-known; only the root selector needs browser JavaScript.</p>
    <CodeBlock code={`export function getStaticPaths() {
  return ["ko", "en"].map(locale => ({
    params: { locale }, props: { locale }
  }))
}

function LocaleLink({ locale, href, children }) {
  const localizedHref = href === "/" ? "/" + locale : "/" + locale + href
  return <a href={localizedHref}>{children}</a>
}

// src/pages/index.tsx
useEffect(() => {
  const stored = localStorage.getItem("locale")
  const locale = stored === "ko" || stored === "en"
    ? stored
    : navigator.languages.some(value => value.startsWith("en")) ? "en" : "ko"
  location.replace("/" + locale + location.search + location.hash)
}, [])`} />
    <p>Build-known MDX emits as static <code>dangerouslySetInnerHTML</code> without <code>eval()</code> or <code>new Function()</code>. Copy blocks use the native clipboard handler and tabs use ordinary state, so interactive MDX components do not require hydration. Request-time <code>Accept-Language</code> negotiation still belongs in CDN or edge redirects when it must happen before HTML.</p>
    <h3>Browser capability migration</h3>
    <p>Progressive React UI may keep one direct static navigator capability condition. Kudzu emits the unsupported branch as complete static fallback and checks the immutable browser capability once after mount.</p>
    <CodeBlock code={`const canShare = "share" in navigator

return <section>
  <input value={roomLink} readOnly />
  {canShare && <button onClick={async () => {
    await navigator.share({ title: "Join my room", url: roomLink })
  }}>Share</button>}
  <button onClick={async () => {
    await navigator.clipboard.writeText(roomLink)
  }}>Copy</button>
</section>`} />
    <p>Supported browsers mount the branch and its handlers through existing conditional ownership. Unsupported browsers receive no Share button or listener in the document or accessibility tree. The capability local must control exactly one direct JSX <code>&amp;&amp;</code> branch; aliases, escaped values, dynamic names, composed conditions, ternaries, <code>navigator.canShare()</code>, and arbitrary browser render expressions remain unsupported.</p>
    <h3>Responsive external-store migration</h3>
    <p>A reduced Cal.com media-query store can retain the SSR-safe <code>useSyncExternalStore</code> contract. Kudzu turns the false server snapshot into static desktop-first HTML and owns the browser listener through its existing effect lifecycle.</p>
    <CodeBlock code={`const isMobile = useSyncExternalStore(
  callback => {
    const media = window.matchMedia("(max-width: 768px)")
    media.addEventListener("change", callback)
    return () => media.removeEventListener("change", callback)
  },
  () => window.matchMedia("(max-width: 768px)").matches,
  () => false
)

return <main data-layout={isMobile ? "mobile" : "column"}>
  {isMobile ? "Mobile booking" : "Desktop booking"}
</main>`} />
    <p>The query must be one identical static literal in subscribe and snapshot, cleanup must remove the same <code>change</code> listener, and the server snapshot must be false. Parameterized or imported media hooks, dynamic queries, legacy <code>addListener</code>, arbitrary external stores, and non-boolean snapshots remain unsupported. Static sibling routes receive no JavaScript.</p>
    <p>Ordinary same-file and relative-imported child components may own local state without specialization into a browser component. A direct JSON-safe primitive parent state passed to a destructured child prop remains reactive in child text, attributes, and effect dependencies. A direct setter or inline/simple <code>const</code> callback may cross one component boundary and two additional direct forwarding components before an intrinsic handler invokes it, supporting value adapters such as <code>event =&gt; onValueChange(event.currentTarget.value)</code> without serializing the callback. The first boundary may use an <code>on*</code> prop or pass the direct setter through a <code>set*</code> prop; additional forwarding remains <code>on*</code>-only. Specialized children may own directly serializable <code>useState()</code>, initialize independent state from one direct parent primitive, plain-object, or array-state prop, initialize string state with a direct primitive prop's <code>.toString()</code>, and use <code>useId()</code>, supported effects, and <code>null</code>-initialized object refs. Same-file and relative-imported presentation components also specialize away; nested hooks are supported on unconditional or statically truthy paths. A parent-owned object ref may follow the same proven tree to the intrinsic root. Fourth callback boundaries, additional <code>set*</code> forwarding, aliases, spreads, intermediate adapters, composed prop initializers, and repeated callback uses remain unsupported. Repeated calls receive independent state and effect ownership even when they share generated modules. When a child is inside reactive conditional DOM, removal deletes owned state, drops its handler with the DOM, resolves refs to <code>null</code>, and cleans up effects; re-entry creates fresh state and DOM ownership.</p>
    <p>State-backed keyed lists may stay in a same-file or relative-imported component when the page passes its local state identifier directly as a prop. A same-file keyed row may use a direct <code>export function</code> or exported function-valued <code>const</code> and be reused across static and keyed JSX sites. Specialized wrappers and keyed rows accept JSX children plus inline or direct calling-component <code>const</code> object prop spreads, preserving source-order overrides. Missing destructured props may use directly serializable primitive, plain-object, or array literal defaults. One final identifier rest binding may be forwarded exactly once to the direct intrinsic root, where its attributes and events reuse existing analysis. Export-list/default aliases, non-JSX references, dynamic or computed spreads/defaults, indirect rest use, and prototype-sensitive rest properties remain source-diagnosed. Default, named/aliased, and direct named re-export imports are resolved. Kudzu specializes that component to intrinsic list DOM at build time instead of retaining it in the browser.</p>
    <p>A direct object-state prop may expose one-segment static fields when its child directly maps an array field. Scalar bindings and that selected array effect dependency reuse the parent signal, <code>Object.is</code> comparison, and binding-backed keyed ownership without field state or a browser component. Dynamic paths, aliases, mutation, child state/ref/ID hooks, and opaque call-site values remain unsupported.</p>
    <CodeBlock code={`function ItemList({ items }: { items: Item[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

return <ItemList items={items} />`} />
    <CodeBlock code={`export function ItemRow({ item }: { item: Item }) {
  return <li>{item.name}</li>
}

return <>
  <ItemRow item={featured} />
  <ul>{items.map(item => <ItemRow key={item.id} item={item} />)}</ul>
</>`} />
    <p>A keyed row may map multiple direct array properties of its item recursively at any depth. A block-bodied keyed <code>map</code> callback may declare one top-level <code>const</code> computed from a direct child collection through the supported pure selector pipeline, then use that alias once as a nested keyed list source before its final JSX return. Nested rows may be intrinsic or recursively specialized through same-file and relative-imported components. Kudzu preserves keyed DOM identity at every level; handlers read the latest item, nested conditions patch bounded DOM, and row key paths own multiple serializable state slots, effects, and <code>null</code>-initialized object refs. Parent capture, multiple or mixed-use child aliases, component cycles, dynamic state, and callback refs remain unsupported.</p>
  </section>
}

export function StateSection() {
  return <section className="docs-section" id="state">
    <div className="docs-heading"><span>04</span><div><p>CORE</p><h2>State semantics</h2></div></div>
    <p>Declare local state with the same syntax as React. State may contain serializable primitives, plain objects, or arrays. Setters update logical state immediately and DOM writes batch at the end of the synchronous turn.</p>
    <CodeBlock code={`const [count, setCount] = useState(0)

function growTwice() {
  setCount(count + 1)
  setCount(count + 1)
}

const [weather, setWeather] = useState({ temperature: 28, label: "Warm" })

return <p>{weather.temperature}° {weather.label}</p>`} />
    <p>An anonymous synchronous zero-argument lazy initializer may directly return the same serializable primitive, plain-object, or array literals. Kudzu lowers it at build time; captures and dynamic calls remain unsupported.</p>
    <p>Reactive text and attributes may use recursively chained top-level <code>const</code> locals derived from direct state through supported pure primitive expressions. Kudzu substitutes the expression into the binding evaluator and subscribes its source states; arbitrary calls, mutation, cycles, and structural JSX aliases remain unsupported.</p>
    <p>Derived text patches a comment-bounded text node without adding a wrapper element. Table cells, options, SVG text, layout, and element selectors retain their authored structure.</p>
    <div className="docs-callout"><strong>Result</strong><span>Logical state increases by 2. Bound DOM nodes patch once.</span></div>
    <h3 id="reducers">Reducers</h3>
    <p>Reducer dispatch uses the same immediate logical state and batched DOM commit path without retaining a browser component. The optional third initializer may be an inline, same-file, or relative-imported synchronous one-parameter function whose directly serializable result depends only on a directly serializable initial argument.</p>
    <CodeBlock code={`import todoReducer, { initializeTodos } from "../todoReducer"

const [todos, dispatch] = useReducer(todoReducer, [])
const [prepared, prepare] = useReducer(todoReducer, "Prepared", initializeTodos)
dispatch({ type: "add", title: "Ship" })`} />
    <p>A dispatch may cross one direct prop boundary into a same-file or relative-imported synchronous component. Kudzu specializes the call so the child handler compiles in the parent reducer scope.</p>
    <CodeBlock code={`function Controls({ dispatch }: { dispatch: Dispatch<TodoAction> }) {
  return <button onClick={() => dispatch({ type: "add", title: "Ship" })}>Add</button>
}

return <Controls dispatch={dispatch} />`} />
    <p>Relative TypeScript constants and helpers used inside an imported child handler are bundled into the parent handler graph with collision-free local names. The direct child may be a keyed row receiving its item and dispatch; its event handler reads the latest item and it has the same multiple serializable state, effect, condition, and object-ref support as other keyed rows. The key path preserves hooks across updates and reorder and releases them on removal. A specialized dispatch component may also pass one inline or simple <code>const</code> callback containing dispatch into one relative-imported synchronous intrinsic child.</p>
    <CodeBlock code={`const add = (title: string) => dispatch({ type: "add", title })
return <Input onSubmit={add} />`} />
    <p>The callback is substituted into the child's compiled event handler; it is not serialized. An inline React <code>useCallback</code> wrapper is erased before specialization. Dispatch and callback components may use destructured string, finite-number, boolean, or <code>null</code> defaults; missing props receive those values during specialization. The current migration form requires direct <code>[state, dispatch]</code> destructuring and a pure synchronous two-parameter reducer imported by default or name from a relative TypeScript module. A direct keyed row has the same multiple serializable state, effect, condition, and object-ref support as other keyed rows. Object, array, computed, and function-call defaults, non-keyed local state inside reducer-dispatch-specialized components, dynamic initializer calls or captures, package, namespace, local, async, and generator reducers, package imports or child imports outside handlers, further forwarding, and reducer dispatch through context remain unsupported.</p>
    <h3 id="zustand">Zustand stores</h3>
    <p>Migration source may retain a reduced Zustand store. Kudzu erases the package import, owns the data as one shared-layout state slot, and compiles selected actions into existing functional state updates. React, Zustand, subscriptions, and a generic store runtime are absent from the deploy output.</p>
    <CodeBlock code={`import { create } from "zustand"

type CartState = {
  quantities: Record<string, number>
  add: (id: string) => void
}

export const useCart = create<CartState>(set => ({
  quantities: {},
  add: id => set(state => ({
    quantities: {
      ...state.quantities,
      [id]: (state.quantities[id] ?? 0) + 1,
    },
  })),
}))`} />
    <p>The shared layout must select the store before route components use it. This gives the store layout lifetime and lets same-group navigation preserve both its value and the layout DOM.</p>
    <CodeBlock code={`export function ShopLayout({ children }: { children?: unknown }) {
  const quantities = useCart(state => state.quantities)
  return <>
    <header>Cart {quantities.oak ?? 0}</header>
    {children}
  </>
}

export default function ProductPage() {
  const add = useCart(state => state.add)
  return <button onClick={() => add("oak")}>Add oak</button>
}`} />
    <p>Values survive enhanced navigation only within the configured group using that layout. A reload, direct document load, new tab, cross-group link, or native fallback creates a fresh document and restores the store initializer. Use an API or another durable backend when state must outlive the document session.</p>
    <div className="docs-callout"><strong>Supported subset</strong><span>One exported store, one directly serializable data property, direct property selectors, and synchronous capture-free actions using one-argument merge-form set.</span></div>
    <h3 id="context">Context</h3>
    <p>Context passes default, nested, or reactive object values through component layers without retaining a browser component tree.</p>
    <CodeBlock code={`type ThemeValue = {
  theme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function Toolbar() {
  const value = useContext(ThemeContext)
  if (!value) return null
  return <button className={value.theme === "dark" ? "theme-dark" : "theme-light"} onClick={() => value.setTheme("light")}>Save</button>
}

function App() {
  const [theme, setTheme] = useState("dark")
  return <ThemeContext.Provider value={{ theme, setTheme }}>
    <Toolbar />
  </ThemeContext.Provider>
}`} />
    <p>Context objects may contain state, setters, nested plain data, and static fields. Consumers may destructure or rename properties. A zero-argument relative custom hook may also directly return <code>useContext(Context)</code> for one local or named relative Context module whose single Provider value is a shorthand object of Provider-owned state/setter pairs and synchronous actions. Direct or nested-handler action calls compile into concrete state operations; action-required state/setter fields that are not publicly selected use compiler-owned collision-free aliases, so same-named consumer locals remain valid. Action functions and the Provider tree do not ship. Dynamic Provider values, multiple Providers, action aliases, and private action captures remain unsupported. Ordinary nested Providers with serializable values remain independent.</p>
    <h3 id="effects">Effects</h3>
    <p>Browser-only work can use an inline <code>useEffect</code> callback with a literal dependency array. Kudzu emits that callback as route-specific ESM and patches only state-bound DOM; it does not ship or rerun the component.</p>
    <CodeBlock code={`const [items, setItems] = useState([])

useEffect(async () => {
  const response = await fetch("/api/items")
  setItems(await response.json())
}, [])`} />
    <p>Effects may update text, attributes, conditions, and keyed lists. They may directly return an inline cleanup function. A document effect cleans up when the document leaves outside the browser back-forward cache; an effect in a conditional branch or supported keyed row mounts and cleans up with that DOM owner.</p>
    <p>Use the same ownership for debounced synchronization: create <code>setTimeout()</code> work in a dependency effect and directly return <code>clearTimeout()</code>. Dependency changes and DOM/route removal cancel pending work without a timer runtime.</p>
    <CodeBlock code={`useEffect(() => {
  const timer = setTimeout(() => setSaved(draft), 150)
  return () => clearTimeout(timer)
}, [draft])`} />
    <CodeBlock code={`useEffect(() => {
  const onResize = () => console.log(window.innerWidth)
  window.addEventListener("resize", onResize)
  return () => window.removeEventListener("resize", onResize)
}, [])`} />
    <p>One or more primitive state and runtime parameter identifiers may trigger cleanup and rerun without rerunning the component.</p>
    <CodeBlock code={`const [event, setEvent] = useState("resize")
const [capture, setCapture] = useState(false)

useEffect(() => {
  const listener = () => console.log(event)
  window.addEventListener(event, listener, capture)
  return () => window.removeEventListener(event, listener, capture)
}, [event, capture])`} />
    <p>Kudzu coalesces committed dependency changes, awaits every affected cleanup in declaration order, and then runs new setups in declaration order. Dependencies may be direct signal identifiers, aliases holding JSON-safe primitives, destructured ordinary child props passed directly from parent state, direct property paths over ordinary object state, or one top-level immutable local derived through a supported pure primitive expression from state. Derived dependencies subscribe to their source states but compare the calculated value with <code>Object.is</code>; setup and cleanup evaluate the latest expression. Effect setup and directly returned cleanup callbacks may each be one top-level simple <code>const</code> function in the same component; Kudzu substitutes them into the existing handler. A keyed row may also use direct primitive properties such as <code>[item.id]</code> or <code>[version, item.name]</code>; only rows whose selected values changed rerun, reorder does not rerun, and key changes remount. Whole-object, prototype-sensitive, object-valued, spread, arbitrary-call, and dynamic dependencies are rejected. Indirect or dynamically selected callbacks, callback parameters, cleanup parameters or generators, cross-component references, and non-serializable captures remain unsupported. Routes without dependency effects do not load <code>kudzu-deps.js</code>.</p>
    <p>An effect may own a relative TypeScript module Worker. Kudzu emits its graph separately and creates it only when the effect mounts.</p>
    <CodeBlock code={`useEffect(() => {
  const worker = new Worker(
    new URL("../telemetry.worker.ts", import.meta.url),
    { type: "module" },
  )
  return () => worker.terminate()
}, [])`} />
    <p>The supported form requires unshadowed global <code>Worker</code> and <code>URL</code>, exact <code>import.meta.url</code>, a relative <code>.worker.ts</code> literal, and exactly <code>{`{ type: "module" }`}</code>. Worker imports must use relative TypeScript ESM without JSX, packages, import-equals, dynamic imports, or <code>require()</code>; ordinary runtime imports of Worker source are rejected. Event handlers, imported helpers, and imported keyed-row effects cannot construct relative TypeScript Workers. Give keyed-row Workers to a directly compiled page or local component effect instead.</p>
  </section>
}

export function AttributesSection() {
  return <section className="docs-section" id="attributes">
    <div className="docs-heading"><span>05</span><div><p>CORE · NEW</p><h2>Reactive attributes</h2></div></div>
    <p>State-dependent <code>className</code>, <code>style</code>, <code>disabled</code>, <code>value</code>, and <code>checked</code> use normal React-shaped expressions. Kudzu compiles each expression into an external ESM evaluator and patches only its DOM target.</p>
    <CodeBlock code={`const [active, setActive] = useState(false)
const [loading, setLoading] = useState(false)
const [name, setName] = useState("Kudzu")
const [subscribed, setSubscribed] = useState(false)

return <>
  <div className={active ? "active" : "idle"} />
  <div style={{ opacity: active ? 1 : 0, width: active ? 240 : 0 }} />
  <button disabled={loading}>Save</button>
  <input value={name} onInput={event => setName(event.currentTarget.value)} />
  <input type="checkbox" checked={subscribed} onChange={event => setSubscribed(event.currentTarget.checked)} />
  <select value={name} onChange={event => setName(event.currentTarget.value)} />
  <button aria-expanded={active} data-state={active ? "open" : "closed"} hidden={!active} title={active ? "Active" : "Inactive"} />
</>`} />
    <div className="attribute-grid">
      <div><code>className</code><p>Sets or removes the element's live <code>class</code> attribute.</p></div>
      <div><code>style</code><p>Serializes camelCase object properties, dimensional numbers, unitless values, and CSS custom properties.</p></div>
      <div><code>disabled</code><p>Toggles the boolean attribute and native disabled property.</p></div>
      <div><code>value</code><p>Updates the live value property for controlled inputs and selects.</p></div>
      <div><code>checked</code><p>Updates the live boolean property for controlled checkboxes and radios.</p></div>
      <div><code>any attribute</code><p>Patches standard, <code>aria-*</code>, and <code>data-*</code> attributes without a compiler allowlist.</p></div>
    </div>
    <h3>Inline SVG</h3>
    <p>Static and reactive SVG presentation props use familiar React spellings. Kudzu preserves native names such as <code>viewBox</code> and maps aliases such as <code>fillRule</code>, <code>clipRule</code>, <code>strokeWidth</code>, <code>strokeLinecap</code>, <code>strokeLinejoin</code>, opacity/color props, <code>textAnchor</code>, and <code>vectorEffect</code> to SVG attributes. Reactive conditionals and flat intrinsic keyed lists create replacement nodes in the surrounding SVG namespace while preserving keyed identity. For an accessible selected-point tooltip, use ordinary focus, keyboard, and click handlers on keyed SVG points to update parent state rendered in an external HTML element with <code>role="tooltip"</code>; retained handlers read the latest point after updates.</p>
    <CodeBlock code={`<svg viewBox="0 0 24 24">
  {active && <path fillRule="evenodd" strokeWidth={2} strokeLinecap="round" />}
  {points.map(point => <circle key={point.id} cx={point.x} cy={point.y} r="2" />)}
</svg>`} />
  </section>
}
