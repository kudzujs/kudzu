import { dirname, relative } from "node:path"

export function relativeModulePath(from, to) {
  const path = relative(dirname(from), to).replaceAll("\\", "/")
  return path.startsWith(".") ? path : `./${path}`
}

export function browserPath(path) {
  return path ? new URL(path, "http://kudzu.local").pathname : ""
}

export function assetPath(base, path) {
  return `${base}/${path}`
}

export function withBase(base, path) {
  return base ? `${base}${path}` : path
}
