import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises"
import { tmpdir, loadavg } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const root = fileURLToPath(new URL("..", import.meta.url))
const workspace = join(root, "benchmarks/runtime-matrix")
const results = join(root, "c2-dom-results")
const compiler = await mkdtemp(join(tmpdir(), "c2-dom-phases-"))
await mkdir(results)
const replace = (source, before, after) => {
  assert.equal(source.split(before).length, 2, before)
  return source.replace(before, after)
}
assert.equal(execFileSync("git", ["diff", "v0.17.0", "--", "framework", "bin", "package.json", "package-lock.json"], {cwd:root,encoding:"utf8"}), "")
const protocol = { purpose: "Inclusive phase attribution, not speed comparison", profiles: 3, source: "v0.17.0", initialLoad: loadavg(), caveats: ["Per-call clocks perturb execution", "Nested phase durations overlap", "Hosted VM is not dedicated physical hardware"], acceptance: "Original complete C2 journey and resilience; no changed content or assertions" }
await writeFile(join(results, "protocol.json"), JSON.stringify(protocol, null, 2))
try {
  for (const path of ["framework", "bin", "package.json"]) await cp(join(root,path), join(compiler,path), {recursive:true})
  await symlink(join(root,"node_modules"),join(compiler,"node_modules"))
  await cp(join(workspace,"kudzu/src"),join(compiler,"fixture/src"),{recursive:true})
  await cp(join(workspace,"kudzu/tsconfig.json"),join(compiler,"fixture/tsconfig.json"))
  for (const [file, names] of [["list-runtime.js", ["updateList", "fillStructuralListParts", "initializeGeneralRowHooks"]], ["binding-runtime.js", ["mountBindings", "matching", "register", "patchBinding", "textBindingStarts"]], ["shared-runtime.js", ["mountDom", "unmountDom"]], ["effect-runtime.js", ["createEffectContext"]], ["serialization.js", ["deserialize"]]]) {
    let source = await readFile(join(compiler,"framework",file),"utf8")
    const ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS)
    const nodes = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text))
    assert.equal(nodes.length,names.length)
    for (const node of nodes.reverse()) {
      const start = node.body.getStart(ast)+1, end = node.body.end-1
      source = source.slice(0,start) + `const __phaseStart=performance.now();try{${source.slice(start,end)}}finally{const p=globalThis.__c2Phases??={};const m=p[${JSON.stringify(file+":"+node.name.text)}]??={calls:0,milliseconds:0};m.calls++;m.milliseconds+=performance.now()-__phaseStart;}` + source.slice(end)
    }
    if (file === "shared-runtime.js") source = replace(source, "entry.mount(root)", '{const start=performance.now();try{entry.mount(root)}finally{const p=globalThis.__c2Phases??={};const m=p["mount:"+entry.capability]??={calls:0,milliseconds:0};m.calls++;m.milliseconds+=performance.now()-start}}')
    await writeFile(join(compiler,"framework",file),source)
    await writeFile(join(results,file),source)
  }
  let runner = await readFile(join(workspace,"run.mjs"),"utf8")
  runner = replace(runner,"const workspace = dirname(fileURLToPath(import.meta.url))",`const workspace=${JSON.stringify(workspace)}`)
  runner = replace(runner,'const resultsDirectory = join(workspace, "results")',`const resultsDirectory=${JSON.stringify(results)}`)
  runner = replace(runner, runner.match(/const targets = \[[\s\S]*?\n\]/)[0], `const targets=${JSON.stringify([{id:"kudzu",label:"Instrumented baseline",architecture:"pre-rendered HTML",root:join(compiler,"fixture"),dist:join(compiler,"fixture/dist")}])}`)
  runner = replace(runner,'join(root, "bin/kudzu.mjs"), "build"',`${JSON.stringify(join(compiler,"bin/kudzu.mjs"))}, "build"`)
  runner = replace(runner,"await requireFiles()",'await access(join(root,"bin/kudzu.mjs"),constants.R_OK)')
  runner = replace(runner,"const versions = await frameworkVersions()",'const versions={kudzu:"0.17.0"}')
  runner = replace(runner,"const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)","const browserProfiles = 3")
  runner = replace(runner,'["--headless=new","--remote-debugging-port=0"','["--headless=new","--no-sandbox","--remote-debugging-port=0"')
  const hooks = `for(const [owner,names] of [[Node.prototype,["cloneNode","insertBefore","appendChild"]],[JSON,["parse"]],[Element.prototype,["getAttribute","setAttribute","querySelectorAll"]]])for(const name of names){const original=owner[name];owner[name]=function(...args){const start=performance.now();try{return original.apply(this,args)}finally{const p=globalThis.__c2Phases??={};const m=p["native:"+name]??={calls:0,milliseconds:0};m.calls++;m.milliseconds+=performance.now()-start}};}`
  runner = replace(runner,"source: initialReadyScript()",`source: ${JSON.stringify(hooks)} + initialReadyScript()`)
  runner = replace(runner,"      operations[name] = await evaluate(send, operationExpression(name), true)",`      await evaluate(send,"globalThis.__c2Phases={}")
      operations[name] = await evaluate(send, operationExpression(name), true)
      await writeFile(join(resultsDirectory, profile+"-"+name+"-phases.json"),JSON.stringify(await evaluate(send,"globalThis.__c2Phases"),null,2))`)
  runner = replace(runner,"document.body.offsetHeight; resolve(Number((performance.now() - started).toFixed(3)))","const layoutStart=performance.now();document.body.offsetHeight;globalThis.__c2Phases.layout={calls:1,milliseconds:performance.now()-layoutStart};resolve(Number((performance.now()-started).toFixed(3)))")
  await writeFile(join(results,"runner.mjs"),runner)
  execFileSync(process.execPath,[join(results,"runner.mjs"),"--check"],{cwd:root,stdio:"inherit",timeout:180000})
} catch(error) {
  await writeFile(join(results,"failure.json"),JSON.stringify({error:error.stack,load:loadavg()},null,2))
  throw error
}
