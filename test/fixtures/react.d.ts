declare module "react" {
  export type ReactNode = unknown
  export function Fragment(props: { children?: unknown }): unknown
  export type Dispatch<T> = (value: T | ((previous: T) => T)) => void
  export type RefObject<T> = { readonly current: T | null }
  export type ForwardedRef<T> = RefObject<T> | ((instance: T | null) => void) | null
  export function forwardRef<T, P>(render: (props: P, ref: ForwardedRef<T>) => unknown): (props: P & { ref?: ForwardedRef<T> }) => unknown
  export function useId(): string
  export function useRef<T>(initialValue: null): RefObject<T>
  export function useState<T>(initialValue: () => T): [T, Dispatch<T>]
  export function useState<T>(initialValue: T): [T, Dispatch<T>]
  export function useReducer<State, Action, InitialArg>(reducer: (state: State, action: Action) => State, initialArg: InitialArg, initializer: (initialArg: InitialArg) => State): [State, (action: Action) => void]
  export function useReducer<State, Action>(reducer: (state: State, action: Action) => State, initialValue: State): [State, (action: Action) => void]
  export function useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, dependencies: readonly unknown[]): T
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T
  export function memo<T>(component: T): T

  const React: {
    Fragment: typeof Fragment
    forwardRef: typeof forwardRef
    useId: typeof useId
    useRef: typeof useRef
    useState: typeof useState
    useCallback: typeof useCallback
    useMemo: typeof useMemo
    memo: typeof memo
  }
  export default React
}

declare module "clsx" {
  export default function clsx(...values: unknown[]): string
}

declare module "zustand" {
  export function create<T>(initializer: (set: (update: Partial<T> | ((state: T) => Partial<T>)) => void) => T): <U>(selector: (state: T) => U) => U
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
