export type StateSetter<T> = (value: T | ((previous: T) => T)) => void

export function useState<T>(initialValue: T): [T, StateSetter<T>]

export interface RefObject<T> {
  readonly current: T | null
}

export function useRef<T>(initialValue: null): RefObject<T>

export function behavior(commands: Array<["add" | "set" | "log", unknown, unknown]>): unknown
export function nativeBehavior(module: string, handler: string, states: Array<[string, unknown]>, scope: Array<[string, unknown]>): unknown
export function binding(value: unknown, module: string, handler: string, states: Array<[string, unknown]>, scope: Array<[string, unknown]>): unknown
export function bindingValue(value: unknown): unknown
export function conditional(kind: "and" | "ternary", value: unknown, truthy: () => unknown, falsy: () => unknown, module: string, handler: string, states: Array<[string, unknown]>, scope: Array<[string, unknown]>): unknown
export function list(items: unknown, keyField: string, render: (item: unknown) => unknown): unknown
export function listField(read: () => unknown, field: string): unknown
export function listExpression(read: () => unknown, module: string, handler: string): unknown
export function listItem(): unknown

export function renderPage(
  component: (props: Record<string, never>) => unknown | Promise<unknown>,
  metadata?: {
    title?: string
    description?: string
    lang?: string
    locale?: string
    siteName?: string
    type?: string
    url?: string
    image?: string
    imageAlt?: string
    twitterCard?: string
    twitterImage?: string
    themeColor?: string
    icon?: string
    appleTouchIcon?: string
    manifest?: string
    styles?: boolean
  }
): Promise<{
  html: string
  hasBehaviors: boolean
  hasBindings: boolean
  hasLists: boolean
  hasListStyles: boolean
  hasStateSeed: boolean
  plan: {
    states: Array<{ id: string; name: string; initialValue: unknown }>
    events: Array<{
      event: string
      commands?: Array<[string, string, unknown]>
      native?: { module: string; handler: string; states: Record<string, string>; scope: Record<string, unknown> }
    }>
    bindings: Array<{
      target: string
      state?: string
      module?: string
      handler?: string
      states?: Record<string, string>
      scope?: Record<string, unknown>
      scopeStates?: Record<string, string>
      scopeBindings?: Record<string, unknown>
    }>
    conditions: Array<Record<string, unknown>>
    lists: Array<Record<string, unknown>>
  }
}>
