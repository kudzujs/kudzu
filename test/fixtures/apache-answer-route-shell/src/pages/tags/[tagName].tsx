import { useParams } from "react-router-dom"
import { Shell } from "../../Shell"
export const layout = Shell
export const runtimeParams = true
export default function Tag() { const { tagName } = useParams<{ tagName: string }>(); return <main><h1>Tag</h1><p data-tag-name>{tagName}</p></main> }
