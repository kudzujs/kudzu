import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises"
import { tmpdir, loadavg } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const workspace = join(root, "benchmarks/runtime-matrix")
const results = join(root, "c2-profile-results")
const compiler = await mkdtemp(join(tmpdir(), "c2-restore-profile-"))
await mkdir(results)
const replace = (source, before, after) => {
  assert.equal(source.split(before).length, 2, before)
  return source.replace(before, after)
}
assert.equal(execFileSync("git", ["diff", "v0.17.0", "--", "framework", "bin", "package.json", "package-lock.json"], {cwd:root,encoding:"utf8"}), "")
const protocol = { purpose: "Sampling CPU attribution of rowRestore on uninstrumented output, not speed comparison", profiles: 3, source: "v0.17.0", samplingIntervalMicroseconds: 100, initialLoad: loadavg(), caveats: ["Sampling also has overhead", "Hosted VM is not dedicated physical hardware", "Native rendering may appear as unattributed samples"], acceptance: "Original complete C2 journey and resilience; no changed content or assertions" }
await writeFile(join(results, "protocol.json"), JSON.stringify(protocol, null, 2))
try {
  for (const path of ["framework", "bin", "package.json"]) await cp(join(root,path), join(compiler,path), {recursive:true})
  await symlink(join(root,"node_modules"),join(compiler,"node_modules"))
  await cp(join(workspace,"kudzu/src"),join(compiler,"fixture/src"),{recursive:true})
  await cp(join(workspace,"kudzu/tsconfig.json"),join(compiler,"fixture/tsconfig.json"))
  let runner = await readFile(join(workspace,"run.mjs"),"utf8")
  runner = replace(runner,"const workspace = dirname(fileURLToPath(import.meta.url))",`const workspace=${JSON.stringify(workspace)}`)
  runner = replace(runner,'const resultsDirectory = join(workspace, "results")',`const resultsDirectory=${JSON.stringify(results)}`)
  runner = replace(runner, runner.match(/const targets = \[[\s\S]*?\n\]/)[0], `const targets=${JSON.stringify([{id:"kudzu",label:"Uninstrumented baseline",architecture:"pre-rendered HTML",root:join(compiler,"fixture"),dist:join(compiler,"fixture/dist")}])}`)
  runner = replace(runner,'join(root, "bin/kudzu.mjs"), "build"',`${JSON.stringify(join(compiler,"bin/kudzu.mjs"))}, "build"`)
  runner = replace(runner,"await requireFiles()",'await access(join(root,"bin/kudzu.mjs"),constants.R_OK)')
  runner = replace(runner,"const versions = await frameworkVersions()",'const versions={kudzu:"0.17.0"}')
  runner = replace(runner,"const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)","const browserProfiles = 3")
  runner = replace(runner,'["--headless=new","--remote-debugging-port=0"','["--headless=new","--no-sandbox","--remote-debugging-port=0"')
  runner = replace(runner,"      operations[name] = await evaluate(send, operationExpression(name), true)",`      if(name === "rowRestore") {
        await send("Profiler.enable")
        await send("Profiler.setSamplingInterval", {interval:100})
        await send("Profiler.start")
      }
      operations[name] = await evaluate(send, operationExpression(name), true)
      if(name === "rowRestore") {
        const {profile: cpuProfile} = await send("Profiler.stop")
        await writeFile(join(resultsDirectory, profile+"-rowRestore.cpuprofile"),JSON.stringify(cpuProfile))
        await send("Profiler.disable")
      }`)
  await writeFile(join(results,"runner.mjs"),runner)
  execFileSync(process.execPath,[join(results,"runner.mjs"),"--check"],{cwd:root,stdio:"inherit",timeout:180000})
  await cp(join(compiler,"fixture/dist"),join(results,"dist"),{recursive:true})
} catch(error) {
  await writeFile(join(results,"failure.json"),JSON.stringify({error:error.stack,load:loadavg()},null,2))
  throw error
}
