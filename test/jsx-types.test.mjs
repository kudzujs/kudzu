import assert from "node:assert/strict"
import test from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"

test("JSX types preserve native event targets and reject string HTML booleans", () => {
  const file = fileURLToPath(new URL("../jsx-type-check.tsx", import.meta.url))
  const source = `
    import type { JSX } from "./framework/jsx-runtime.js"
    const button = <button onClick={event => {
      event.currentTarget.checkValidity()
      if (event.target instanceof HTMLButtonElement) event.target.checkValidity()
      // @ts-expect-error A bubbling click can originate on a child.
      event.target.checkValidity()
    }}><span>Save</span></button>
    const input = <input disabled={false} checked={true} required={null}
      onInput={event => event.currentTarget.value}
      onChange={event => event.currentTarget.checked} />
    const form = <form onSubmit={event => new FormData(event.currentTarget)} />
    const svg = <svg><circle onClick={event => event.currentTarget.cx} /></svg>
    const attributes = <div hidden="until-found" aria-hidden="false" data-active="true" />
    const custom = <custom-control disabled="false" />
    // @ts-expect-error HTML boolean attributes must use booleans, not strings.
    const disabled = <input disabled="false" />
    // @ts-expect-error Attribute spreads must receive the same validation.
    const spread = <input {...{ checked: "false" }} />
    // @ts-expect-error Object-form JSX props must receive the same validation.
    const props: JSX.IntrinsicElements["select"] = { multiple: "false" }
  `
  const options = {
    strict: true,
    noEmit: true,
    types: [],
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: "@kudzujs/core"
  }
  const host = ts.createCompilerHost(options)
  const getSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (name, languageVersion, ...rest) => name === file
    ? ts.createSourceFile(name, source, languageVersion, true, ts.ScriptKind.TSX)
    : getSourceFile(name, languageVersion, ...rest)
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options, host))
  assert.deepEqual(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")), [])
})
