import { type RefObject, useEffect } from "react"

export default function useOutsideClickAlerter(ref: RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as HTMLElement)) callback()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [ref, callback])
}
