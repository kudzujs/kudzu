export namespace JSX {
  type Element = any
  type Children = unknown

  type TargetedEvent<Target extends EventTarget, NativeEvent extends Event = Event> = NativeEvent & {
    currentTarget: Target
  }

  type HTMLBooleanAttributes = {
    [Name in "allowFullScreen" | "async" | "autoFocus" | "autoPlay" | "checked" | "controls" | "default" | "defer" | "disabled" | "formNoValidate" | "inert" | "loop" | "multiple" | "muted" | "noValidate" | "open" | "playsInline" | "readOnly" | "required" | "reversed" | "selected"]?: boolean | null
  }

  // shortcut: preserve unlisted attributes for migration input until a complete HTML/SVG attribute contract is available.
  type IntrinsicProps<Target extends EventTarget> = Record<string, unknown> & {
    children?: Children
    onBlur?: (event: TargetedEvent<Target, FocusEvent>) => unknown
    onChange?: (event: TargetedEvent<Target>) => unknown
    onClick?: (event: TargetedEvent<Target, MouseEvent>) => unknown
    onCompositionStart?: (event: TargetedEvent<Target, CompositionEvent>) => unknown
    onCompositionEnd?: (event: TargetedEvent<Target, CompositionEvent>) => unknown
    onDrop?: (event: TargetedEvent<Target, DragEvent>) => unknown
    onFocus?: (event: TargetedEvent<Target, FocusEvent>) => unknown
    onInput?: (event: TargetedEvent<Target, InputEvent>) => unknown
    onKeyDown?: (event: TargetedEvent<Target, KeyboardEvent>) => unknown
    onKeyUp?: (event: TargetedEvent<Target, KeyboardEvent>) => unknown
    onMouseEnter?: (event: TargetedEvent<Target, MouseEvent>) => unknown
    onMouseLeave?: (event: TargetedEvent<Target, MouseEvent>) => unknown
    onPaste?: (event: TargetedEvent<Target, ClipboardEvent>) => unknown
    onPointerDown?: (event: TargetedEvent<Target, PointerEvent>) => unknown
    onPointerMove?: (event: TargetedEvent<Target, PointerEvent>) => unknown
    onPointerUp?: (event: TargetedEvent<Target, PointerEvent>) => unknown
    onScroll?: (event: TargetedEvent<Target>) => unknown
    onSubmit?: (event: TargetedEvent<Target, SubmitEvent>) => unknown
  }

  interface IntrinsicAttributes {
    key?: string | number
  }

  type IntrinsicElements = {
    [Name in keyof HTMLElementTagNameMap]: IntrinsicProps<HTMLElementTagNameMap[Name]> & HTMLBooleanAttributes
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
