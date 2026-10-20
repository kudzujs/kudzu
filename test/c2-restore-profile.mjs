import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises"
import { tmpdir, loadavg } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const workspace = join(root, "benchmarks/runtime-matrix")
const results = join(root, "c2-matched-results")
const compiler = await mkdtemp(join(tmpdir(), "c2-restore-profile-"))
await mkdir(results)
const replace = (source, before, after) => {
  assert.equal(source.split(before).length, 2, before)
  return source.replace(before, after)
}
assert.equal(execFileSync("git", ["diff", "v0.17.0", "--", "framework", "bin", "package.json", "package-lock.json"], {cwd:root,encoding:"utf8"}), "")
const protocol = { purpose: "Matched React/Kudzu rowRestore rendering attribution on one VM", profilesPerTarget: 3, order: "alternating target order", source: "v0.17.0", initialLoad: loadavg(), caveats: ["Tracing and harness marks have overhead", "Three profiles do not establish a speed ranking", "Hosted VM is not dedicated physical hardware", "Nested timeline durations overlap"], acceptance: "Original complete C2 journey and resilience; unchanged output and conditions; harness adds only user-timing marks and DOM observations" }
await writeFile(join(results, "protocol.json"), JSON.stringify(protocol, null, 2))
try {
  for (const path of ["framework", "bin", "package.json"]) await cp(join(root,path), join(compiler,path), {recursive:true})
  await symlink(join(root,"node_modules"),join(compiler,"node_modules"))
  await cp(join(workspace,"kudzu/src"),join(compiler,"fixture/src"),{recursive:true})
  await cp(join(workspace,"kudzu/tsconfig.json"),join(compiler,"fixture/tsconfig.json"))
  let runner = await readFile(join(workspace,"run.mjs"),"utf8")
  runner = replace(runner,"const workspace = dirname(fileURLToPath(import.meta.url))",`const workspace=${JSON.stringify(workspace)}`)
  runner = replace(runner,'const resultsDirectory = join(workspace, "results")',`const resultsDirectory=${JSON.stringify(results)}`)
  runner = replace(runner, runner.match(/const targets = \[[\s\S]*?\n\]/)[0], `const targets=${JSON.stringify([{id:"kudzu",label:"Uninstrumented baseline",architecture:"pre-rendered HTML",root:join(compiler,"fixture"),dist:join(compiler,"fixture/dist")},{id:"react",label:"React",architecture:"client-side VDOM",root:join(workspace,"react"),dist:join(workspace,"react/dist")}])}`)
  runner = replace(runner,'join(root, "bin/kudzu.mjs"), "build"',`${JSON.stringify(join(compiler,"bin/kudzu.mjs"))}, "build"`)
  runner = replace(runner,"await requireFiles()",'await access(join(root,"bin/kudzu.mjs"),constants.R_OK)')
  runner = replace(runner,'[join(workspace, "build-vite.mjs"), target.id]', '[join(workspace, "react/build.mjs")]')
  runner = replace(runner,"const versions = await frameworkVersions()",'const versions={kudzu:"0.17.0",react:"19.2.8",vite:"8.1.5"}')
  runner = replace(runner,"const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)","const browserProfiles = 3")
  runner = replace(runner,'["--headless=new","--remote-debugging-port=0"','["--headless=new","--no-sandbox","--remote-debugging-port=0"')
  runner = replace(runner,"      operations[name] = await evaluate(send, operationExpression(name), true)",`      let traceEvents, traceDone, traceTimer
      if(name === "rowRestore") {
        traceEvents=[]
        traceDone=new Promise((resolve,reject)=>{
          traceTimer=setTimeout(()=>reject(new Error("Trace completion deadline")),15000)
          client.onEvent(message=>{
            if(message.method==="Tracing.dataCollected") traceEvents.push(...message.params.value)
            if(message.method==="Tracing.tracingComplete") {clearTimeout(traceTimer);resolve()}
          })
        })
        await client.send("Tracing.start",{categories:"devtools.timeline,blink.user_timing",transferMode:"ReportEvents"})
      }
      operations[name] = await evaluate(send, operationExpression(name), true)
      if(name === "rowRestore") {
        await client.send("Tracing.end")
        await traceDone
        await writeFile(join(resultsDirectory, target.id+"-"+profile+"-rowRestore.trace.json"),JSON.stringify({traceEvents}))
        const dom=await evaluate(send, \`({rows:document.querySelectorAll('[data-row]').length,rowElements:document.querySelector('[data-rows]').querySelectorAll('*').length,rowExample:document.querySelector('[data-row="0"]').outerHTML,bodyHeight:document.body.offsetHeight,viewport:[innerWidth,innerHeight],bodyText:document.body.innerText})\`)
        await writeFile(join(resultsDirectory,target.id+"-"+profile+"-dom.json"),JSON.stringify(dom,null,2))
      }`)
  runner = replace(runner,'if (!(${operation[1]})) return;', 'if ("${name}" === "rowRestore") performance.mark("c2-predicate-start"); const complete=(${operation[1]}); if ("${name}" === "rowRestore") performance.mark("c2-predicate-end"); if (!complete) return;')
  runner = replace(runner,'document.body.offsetHeight; resolve(Number((performance.now() - started).toFixed(3)))', 'if ("${name}" === "rowRestore") performance.mark("c2-layout-start"); document.body.offsetHeight; if ("${name}" === "rowRestore") performance.mark("c2-layout-end"); resolve(Number((performance.now() - started).toFixed(3)))')
  await writeFile(join(results,"runner.mjs"),runner)
  execFileSync(process.execPath,[join(results,"runner.mjs"),"--check"],{cwd:root,stdio:"inherit",timeout:180000})
  await cp(join(compiler,"fixture/dist"),join(results,"kudzu-dist"),{recursive:true})
  await cp(join(workspace,"react/dist"),join(results,"react-dist"),{recursive:true})
} catch(error) {
  await writeFile(join(results,"failure.json"),JSON.stringify({error:error.stack,load:loadavg()},null,2))
  throw error
}
