# create-kudzu

Requires Node.js 22 or newer.

Create a Kudzu project:

```bash
npm create kudzu@latest my-app
cd my-app
npm run dev
```

The generated project is a working showcase on `@kudzujs/core@^0.16.34` with reusable components, an interactive state example, a zero-JavaScript static route, page metadata, responsive CSS, and `npm run check`. Configuration remains optional until the app needs custom assets, document defaults, navigation, or build hooks.

Use `--no-install` to create the files without installing dependencies.

## Optional AI authoring guidance

`create-kudzu@0.1.156` adds optional local AI developer tools:

```bash
npm create kudzu@latest my-app -- --ai
```

From a source checkout:

```bash
node /path/to/kudzu/packages/create-kudzu/index.mjs my-app --ai
```

This adds a short `AGENTS.md`, a standard-library-only `kudzu-ai.mjs` developer
tool, and an `ai` npm script. Check logs are ignored through `.kudzu-ai/`.
Combine with `--no-install` to generate files without installing packages.
Without `--ai`, the starter stays unchanged.

### Developer tools

```bash
npm run ai -- docs
npm run ai -- docs Authoring
npm run ai -- check
npm run ai -- check --timeout-ms 600000
```

- `docs` lists level-two headings from the installed core README, including the
  installed version and file path. Supply one exact, case-insensitive heading
  (quote multi-word headings) to return that section. Sections are capped at
  6,000 characters with explicit truncation and original line ranges. Follow the
  file reference if more is needed. This uses the generated npm dependency layout;
  install dependencies before reading docs. It makes no network or model calls.
- `check` executes the app's existing `npm run check`, including its npm lifecycle
  hooks, from the project root. It returns JSON status, exit code, timing and a
  log excerpt. Failure stays nonzero. The default timeout is five minutes; choose
  an integer from 1 to 1,200,000 ms. Timeout/cancellation terminates the spawned
  process group on Unix or process tree on Windows and reports failure.
- Full stdout/stderr are retained in a unique `.kudzu-ai/check-*/output.log`.
  Large logs show the first/last 2,048 bytes with an omission marker; an error may
  be in the omitted middle. Read the full log when needed. Old logs are not deleted
  automatically; remove `.kudzu-ai/` when no longer needed.
- The tool does not cache checks or certify browser behavior. Later edits require
  a new check. Scripts that intentionally detach background jobs or custom
  deployment rules need their own lifecycle/asset handling. Use
  `npm run --silent ai -- check` to suppress npm's outer lifecycle banner.

Start a new [OpenCode](https://opencode.ai/docs/rules/) or
[Codex](https://developers.openai.com/codex/agent-configuration/agents-md) session
from the app root to use their documented project-instruction discovery. Other
agents need support for `AGENTS.md` or an explicit request to read it. Editor
installation alone does not load instructions. Overrides, disabled discovery,
context limits, and headless modes can change loading; verify the effective
instructions in the agent you actually use.

AGENTS.md supplies guidance; kudzu-ai.mjs performs real document lookup and check
execution. The host's existing shell tool can invoke it without an MCP connection
or plugin. It does not intercept every agent action or force use of these commands.
There is no additional dependency, agent installation, or model call for these
tools. Both files stay outside `src` and `public` and are excluded by the default
Kudzu build. Custom asset-copy/deployment settings can still publish root files.
Instructions and tool responses add input context; lower total AI cost is unmeasured.

For an existing app, generate a disposable `--ai --no-install` project, copy
`kudzu-ai.mjs`, add `"ai": "node kudzu-ai.mjs"` to your scripts and `.kudzu-ai/` to
your ignore rules, and merge the applicable instructions into your existing rules.
Keep your real `check` script; do not make it invoke `ai check` recursively.
The generator rejects nonempty targets. Generated tools/rules are snapshots, not
auto-updated when Kudzu is upgraded; review them with your existing app setup.
