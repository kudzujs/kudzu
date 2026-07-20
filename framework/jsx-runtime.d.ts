export namespace JSX {
  type Element = unknown
  type Children = unknown

  interface IntrinsicAttributes {
    key?: string | number
  }

  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>
  }
}

export const Fragment: unique symbol
export function jsx(type: unknown, props: unknown, key?: string): JSX.Element
export const jsxs: typeof jsx
export const jsxDEV: typeof jsx
