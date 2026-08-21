import { join } from "node:path"

export function createParamCodegen({ browserPath, inlineJson, relativeModulePath }) {
  return function printParamEntry(schema, params, searchParams, searchParamsWritable, output, runtimeDirectory, base, runtimeName, navigable) {
    const hasSearch = searchParams.length || searchParamsWritable
    const signature = hasSearch ? "pathname, search" : "pathname"
    const prefix = navigable ? `export function initializeParams(${signature}) {\n${searchParamsWritable ? "globalThis.__kSetSearchParams = setSearchParams\n" : ""}` : `${schema ? "let pathname = location.pathname\n" : ""}${hasSearch ? "let search = location.search\n" : ""}`
    const suffix = navigable ? "\n}" : ""
    const pathname = schema ? `const base = ${inlineJson(browserPath(base).slice(1).split("/").filter(Boolean).map(segment => decodeURIComponent(segment)))}
const schema = ${inlineJson(schema.segments)}
const params = ${inlineJson(params)}
let path = pathname
if (base.length) {
  const pathSegments = path.slice(1).split("/")
  if (pathSegments.length < base.length || base.some((segment, index) => decodeSegment(pathSegments[index], false) !== segment)) throw new Error("Runtime route is outside the configured base")
  path = "/" + pathSegments.slice(base.length).join("/")
}
if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
const segments = path.slice(1).split("/")
if (segments.length !== schema.length) throw new Error("Runtime route does not match its fallback pattern")
const values = Object.create(null)
for (let index = 0; index < schema.length; index++) {
  const segment = schema[index]
  const value = decodeSegment(segments[index], Boolean(segment.param))
  if (segment.literal !== undefined && value !== segment.literal) throw new Error("Runtime route literal does not match")
  if (segment.param) values[segment.param] = value
}
for (const param of params) {
  const value = values[param.name]
  browserState.set(param.id, value)
  commitDom(param.id, value)
}
function decodeSegment(raw, param) {
  if (param && /%(?:2f|5c)/i.test(raw)) throw new Error("Runtime route parameter contains an encoded separator")
  let value
  try { value = decodeURIComponent(raw) } catch { throw new Error("Runtime route parameter has malformed encoding") }
  const decodedDots = value.replace(/%2e/gi, ".")
  if (param && (!value || value === "." || value === ".." || decodedDots === "." || decodedDots === ".." || /[\\/?#]/.test(value) || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159) || /%(?:2f|5c)/i.test(value))) throw new Error("Runtime route parameter is invalid")
  return value
}
` : ""
    const searchInitializer = searchParams.length ? `function initializeSearch(search) {
const query = new URLSearchParams(search)
for (const param of ${inlineJson(searchParams)}) {
  const value = query.get(param.name)
  browserState.set(param.id, value)
  commitDom(param.id, value)
}
}
` : ""
    const query = searchParams.length ? "initializeSearch(search)\n" : ""
    const writer = searchParamsWritable ? `
function setSearchParams(update, replace) {
  const next = update(new URLSearchParams(location.search))
  if (!(next instanceof URLSearchParams)) throw new Error("React Router search parameter updater must return URLSearchParams")
  const url = new URL(location.href)
  url.search = next.toString()
  history[replace ? "replaceState" : "pushState"](null, "", url)
  ${searchParams.length ? "initializeSearch(location.search)" : ""}
}
${navigable ? "" : `globalThis.__kSetSearchParams = setSearchParams
addEventListener("popstate", () => ${searchParams.length ? "initializeSearch(location.search)" : "undefined"})`}` : ""
    const reader = !navigable && !searchParamsWritable && searchParams.length ? '\naddEventListener("popstate", () => initializeSearch(location.search))' : ""
    return `import { browserState, commitDom } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, runtimeName)))}
${searchInitializer}${prefix}${pathname}${query}${suffix}${writer}${reader}`
  }
}
