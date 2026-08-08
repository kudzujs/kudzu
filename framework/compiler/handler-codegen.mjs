export function createHandlerCodegen({ resolveClientImport }) {
  return function printHandlerModule({ moduleIR, handlerPath }) {
    return [
      printClientImports(moduleIR.imports, handlerPath),
      ...moduleIR.handlers.filter(handler => handler.kind === "module-export").map(handler => handler.code),
      ...moduleIR.bindings.map(binding => binding.code)
    ].join("\n")
  }

  function printClientImports(entries, handlerPath) {
    const groups = Map.groupBy(entries, entry => entry.target)
    const imports = []
    for (const [target, group] of groups) {
      const specifier = resolveClientImport(group[0], handlerPath)
      const defaults = group.filter(entry => entry.kind === "default")
      const named = group.filter(entry => entry.kind === "named")
      if (defaults.length === 1 || named.length) imports.push(`import ${defaults.length === 1 ? `${defaults[0].local}${named.length ? ", " : ""}` : ""}${named.length ? `{ ${named.map(entry => entry.imported === entry.local ? entry.local : `${entry.imported} as ${entry.local}`).join(", ")} }` : ""} from ${JSON.stringify(specifier)}`)
      if (defaults.length > 1) for (const entry of defaults) imports.push(`import ${entry.local} from ${JSON.stringify(specifier)}`)
      for (const entry of group.filter(entry => entry.kind === "namespace")) imports.push(`import * as ${entry.local} from ${JSON.stringify(specifier)}`)
    }
    return imports.join("\n")
  }
}
