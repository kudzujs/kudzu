type IconProps = {
  "aria-hidden"?: boolean
  "data-icon"?: string
  className?: string
  fill?: string
  height?: number
  role?: string
  size?: number
  strokeWidth?: number
  title?: string
  width?: number
}

export function SearchIcon({ size = 24, width = size, height = size, strokeWidth = 2, title, ...iconProps }: IconProps) {
  return <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...iconProps}>
    {title && <title>{title}</title>}
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
}

export function CheckIcon({ size = 24, width = size, height = size, strokeWidth = 2, title, ...iconProps }: IconProps) {
  return <svg viewBox="0 0 24 24" width={width} height={height} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...iconProps}>
    {title && <title>{title}</title>}
    <path d="m5 12 4 4L19 6" />
  </svg>
}
