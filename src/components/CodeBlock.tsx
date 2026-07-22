const codeTokens = /(?<comment>\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(?<string>`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<tag><\/?[A-Za-z][\w.]*(?=[\s/>]))|(?<attribute>\b[A-Za-z_:][\w:.-]*(?=\s*=(?!=|>)))|(?<keyword>\b(?:async|await|const|default|else|export|false|from|function|if|import|interface|let|new|null|return|true|type|undefined)\b)|(?<number>\b\d+(?:\.\d+)?\b)|(?<call>\b[A-Za-z_$][\w$]*(?=\s*\())|(?<operator>=>|===|!==|==|!=|&&|\|\||[=?:])/g
const shellTokens = /(?<string>"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(?<call>\b(?:cd|npm|npx)\b)|(?<operator>--[\w-]+)/g

export function CodeBlock({ code, language = "tsx" }: { code: string; language?: "tsx" | "shell" | "text" }) {
  if (language === "text") return <pre><code className="code-highlight">{code}</code></pre>
  const tokens = language === "shell" ? shellTokens : codeTokens
  const content: unknown[] = []
  let offset = 0
  for (const match of code.matchAll(tokens)) {
    if (match.index > offset) content.push(code.slice(offset, match.index))
    let kind = Object.entries(match.groups ?? {}).find(([, value]) => value)?.[0]
    if (kind === "attribute" && !insideJsxTag(code, match.index)) kind = undefined
    content.push(kind ? codeToken(match[0], kind) : match[0])
    offset = match.index + match[0].length
  }
  if (offset < code.length) content.push(code.slice(offset))
  return <pre><code className="code-highlight">{content}</code></pre>
}

function insideJsxTag(code: string, index: number) {
  const open = code.lastIndexOf("<", index)
  return open > code.lastIndexOf(">", index) && /^<\/?[A-Za-z]/.test(code.slice(open))
}

function codeToken(token: string, kind?: string) {
  if (kind === "comment") return <span className="tok-comment">{token}</span>
  if (kind === "string") return <span className="tok-string">{token}</span>
  if (kind === "tag") return <span className="tok-tag">{token}</span>
  if (kind === "attribute") return <span className="tok-attribute">{token}</span>
  if (kind === "number") return <span className="tok-number">{token}</span>
  if (kind === "call") return <span className="tok-call">{token}</span>
  if (kind === "operator") return <span className="tok-operator">{token}</span>
  return <span className="tok-keyword">{token}</span>
}
