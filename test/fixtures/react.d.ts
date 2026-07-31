declare module "react" {
  export function Fragment(props: { children?: unknown }): unknown
  export type Dispatch<T> = (value: T | ((previous: T) => T)) => void
  export function useState<T>(initialValue: T): [T, Dispatch<T>]

  const React: {
    Fragment: typeof Fragment
  }
  export default React
}

declare module "*.png" {
  const url: string
  export default url
}

declare module "*.svg" {
  const url: string
  export default url
}

declare module "*.webp" {
  const url: string
  export default url
}

declare module "*.woff2" {
  const url: string
  export default url
}

declare module "*?url" {
  const url: string
  export default url
}

declare module "*.module.css" {
  const classes: Record<string, string>
  export default classes
}
