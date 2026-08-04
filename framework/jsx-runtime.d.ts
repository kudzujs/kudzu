export namespace JSX {
  type Element = any
  type Children = unknown

  type TargetedEvent<Target extends EventTarget, NativeEvent extends Event = Event> = NativeEvent & {
    currentTarget: Target
    target: EventTarget & Target
  }

  type IntrinsicProps<Target extends EventTarget> = Record<string, unknown> & {
    children?: Children
    onBlur?: (event: TargetedEvent<Target, FocusEvent>) => unknown
    onChange?: (event: TargetedEvent<Target>) => unknown
    onClick?: (event: TargetedEvent<Target, MouseEvent>) => unknown
    onFocus?: (event: TargetedEvent<Target, FocusEvent>) => unknown
    onInput?: (event: TargetedEvent<Target, InputEvent>) => unknown
    onKeyDown?: (event: TargetedEvent<Target, KeyboardEvent>) => unknown
    onKeyUp?: (event: TargetedEvent<Target, KeyboardEvent>) => unknown
    onSubmit?: (event: TargetedEvent<Target, SubmitEvent>) => unknown
  }

  interface IntrinsicAttributes {
    key?: string | number
  }

  type IntrinsicElements = {
    [Name in keyof HTMLElementTagNameMap]: IntrinsicProps<HTMLElementTagNameMap[Name]>
  } & {
    [Name in keyof SVGElementTagNameMap]: IntrinsicProps<SVGElementTagNameMap[Name]>
  } & {
    [elementName: string]: Record<string, unknown>
  }
}

export const Fragment: unique symbol
export function jsx(type: unknown, props: unknown, key?: string): JSX.Element
export const jsxs: typeof jsx
export const jsxDEV: typeof jsx
