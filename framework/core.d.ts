export type StateSetter<T> = (value: T | ((previous: T) => T)) => void
export type Reducer<State, Action> = (state: State, action: Action) => State
export type Dispatch<Action> = (action: Action) => void
export type EffectCleanup = () => void | Promise<void>
export type EffectDependency = string | number | boolean | null
export const Fragment: unique symbol

export function useId(): string
export function useState<T>(initialValue: () => T): [T, StateSetter<T>]
export function useState<T>(initialValue: T): [T, StateSetter<T>]
export function useReducer<State, Action, InitialArg>(reducer: Reducer<State, Action>, initialArg: InitialArg, initializer: (initialArg: InitialArg) => State): [State, Dispatch<Action>]
export function useReducer<State, Action>(reducer: Reducer<State, Action>, initialValue: State): [State, Dispatch<Action>]
export function useEffect(effect: () => void | EffectCleanup | Promise<void>, dependencies: readonly EffectDependency[]): void
export function useParams<Params extends Record<string, string> = Record<string, string>>(): Readonly<Params>
export function useSearchParam(name: string): string | null
export function useSearchParamsWriter(): [undefined, undefined]

export interface RefObject<T> {
  current: T | null
}

export function useRef<T>(initialValue: null): RefObject<T>
export function useRef(initialValue: 0): { current: number }
export function useSyncExternalStore<T>(subscribe: (callback: () => void) => () => void, getSnapshot: () => T, getServerSnapshot: () => T): T

export interface Context<T> {
  Provider: (props: { value: T; children?: unknown }) => unknown
}

export function createContext<T>(defaultValue: T): Context<T>
export function useContext<T>(context: Context<T>): T

declare const React: { Fragment: typeof Fragment }
export default React

export function behavior(commands: Array<["add" | "set" | "log", unknown, unknown]>): unknown
export function nativeBehavior(module: string, handler: string, states: Array<[string, unknown]>, scope: Array<[string, unknown]>): unknown
export function binding(value: unknown, module: string, handler: string, states: Array<[string, unknown]>, scope: Array<[string, unknown]>): unknown
export function bindingValue(value: unknown): unknown
export function conditional(kind: "and" | "ternary", value: unknown, truthy: () => unknown, falsy: () => unknown, module: string, handler: string, states: Array<[string, unknown]>, scope: Array<[string, unknown]>): unknown
export function list(items: unknown, keyField: string | null, render: (item: unknown, index: number) => unknown, ownerField?: string, selector?: unknown[], indexed?: boolean, selectorStates?: Array<[string, unknown]>, staticCollection?: boolean): unknown
export function listField(read: () => unknown, field: string): unknown
export function listExpression(read: () => unknown, module: string, handler: string, states?: Array<[string, unknown]>): unknown
export function listItem(): unknown
export function listIndex(): unknown
export function listConditional(kind: "and" | "ternary", read: () => unknown, truthy: () => unknown, falsy: () => unknown, module: string, handler: string): unknown

export type PageMetadata = {
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
  styles?: boolean | string[]
  base?: string
  runtimeAsset?: string
  effectAsset?: string
  nativeAsset?: string
  paramAsset?: string
  runtimeParams?: string[]
  navigationAsset?: string
  applicationId?: string
  layoutId?: string
  routeId?: string
}

export type MetadataContext<Props = Record<string, unknown>> = {
  route: string
  params: Record<string, string>
  props: Props
}

export function renderPage<Props = Record<string, never>>(
  component: (props: Props) => unknown | Promise<unknown>,
  metadata?: PageMetadata,
  props?: Props,
  layout?: (props: { children: unknown }) => unknown | Promise<unknown>
): Promise<{
  html: string
  hasBehaviors: boolean
  hasEffects: boolean
  hasParams: boolean
  hasBindings: boolean
  hasLists: boolean
  hasListStyles: boolean
  hasStateSeed: boolean
  handlerModules: string[]
  plan: {
    states: Array<{ id: string; name: string; initialValue: unknown; lifetime?: "layout" | "route"; internal?: true }>
    params: Array<{ name: string; id: string }>
    searchParams: Array<{ name: string; id: string }>
    searchParamsWritable: boolean
    events: Array<{
      event: string
      commands?: Array<[string, string, unknown]>
      native?: { module: string; handler: string; states: Record<string, string>; scope: Record<string, unknown> }
    }>
    effects: Array<{ module: string; handler: string; states: Record<string, string>; scope: Record<string, unknown>; lifetime?: "layout" | "route"; dependencies?: string[]; itemDependencies?: string[]; listState?: string; cleanup?: true; owner?: string; list?: true }>
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
