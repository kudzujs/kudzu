export const Fragment = Symbol.for("kudzu.fragment")

export function jsx(type, props, key) {
  return { type, props: key == null ? props : { ...props, key } }
}

export const jsxs = jsx
export const jsxDEV = jsx
