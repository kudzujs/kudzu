declare const require: (name: string) => { version: string }

export function helper() {
  return require("typescript").version.length
}
