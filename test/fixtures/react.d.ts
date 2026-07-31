declare module "react" {
  export function Fragment(props: { children?: unknown }): unknown
  export type Dispatch<T> = (value: T | ((previous: T) => T)) => void
  export function useState<T>(initialValue: T): [T, Dispatch<T>]

  const React: {
    Fragment: typeof Fragment
  }
  export default React
}
