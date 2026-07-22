const unitless = new Set([
  "animationIterationCount", "aspectRatio", "borderImageOutset", "borderImageSlice", "borderImageWidth",
  "columnCount", "columns", "flex", "flexGrow", "flexShrink", "fontWeight", "gridArea", "gridColumn",
  "gridColumnEnd", "gridColumnSpan", "gridColumnStart", "gridRow", "gridRowEnd", "gridRowSpan", "gridRowStart",
  "lineClamp", "lineHeight", "opacity", "order", "orphans", "scale", "tabSize", "widows", "zIndex", "zoom",
  "fillOpacity", "floodOpacity", "stopOpacity", "strokeDasharray", "strokeDashoffset", "strokeMiterlimit",
  "strokeOpacity", "strokeWidth"
])

export function serializeStyle(value) {
  if (value == null || value === false) return ""
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("style must be an object")
  return Object.entries(value).flatMap(([property, entry]) => {
    if (entry == null || typeof entry === "boolean") return []
    if (typeof entry === "number" && !Number.isFinite(entry)) throw new Error(`style.${property} must be finite`)
    const suffix = typeof entry === "number" && entry !== 0 && !property.startsWith("--") && !unitless.has(property) ? "px" : ""
    return `${toKebabCase(property)}:${entry}${suffix}`
  }).join(";")
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`).replace(/^ms-/, "-ms-")
}
