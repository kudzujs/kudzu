# Astro Content comparison starter

This maintainer record is outside the model starter and public task context.

This is a pre-task input, not an AI-generated success. It uses Astro pages,
components and slots to render the same six articles, styles and eleven routes
as the existing Content comparators. The article index intentionally has no
search implementation. Normal Astro page scripts are permitted for the task.

Pinned tools: Astro 7.0.2, @astrojs/check 0.9.10, TypeScript 6.0.3. Astro's checker
accepts TypeScript 5/6, not the existing comparator's TypeScript 7.0.2. Do not
describe these as identical typechecker versions. Any future model experiment
must explicitly freeze this difference or align supported versions for all
comparators before execution, along with the task, budgets and tool permissions.

From the repository root:

```sh
npm --prefix test/fixtures/ai-delivery-production/content/starters/astro ci --ignore-scripts --no-audit --no-fund
node test/astro-content-smoke.mjs
```

The smoke copies this starter into a temporary workspace, checks all eleven
static routes, then adds a private validation-only native-script implementation.
It runs the existing behavior/accessibility/browser acceptance plus the same
ten-static-sibling output requirement used for Kudzu, and rejects a script added
to a static sibling. That validation implementation is outside this starter and
must not be included in an agent's input or public context.

This input is not added to the frozen five-task protocols. No model run or
framework ranking is implied. The current production summarizer supports
protocol-declared comparators and marks missing task coverage incomplete.
