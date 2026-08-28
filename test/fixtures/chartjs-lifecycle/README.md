# Mattermost Chart.js Lifecycle Reduction

- Upstream: `mattermost/mattermost`
- Revision: `53373e3752c6e8d7979b787f342fea4c56e68472`
- Source: `webapp/channels/src/components/analytics/doughnut_chart.tsx`
- Source SHA-256: `4410f66d8358b9fa748ccacfaf5135fb9fe6c256434e7c234415d4d56a0efbf7`
- Test source SHA-256: `31214f77ebb8085f96d12f430e281943536b077facd0c7e46b40070324d8895b`
- Application license: Apache-2.0
- Package: `chart.js@3.8.2`, MIT

The upstream component owns a canvas ref and a retained Chart.js ref. Its data
effect creates or updates the chart, while a separate mount cleanup destroys it.
The direct reduction first failed at the retained ref because instance assignment
occurred in the dependency effect. The accepted fixture keeps the same lifecycle
but gives acquisition, resize-listener registration, and disposal to one mount
effect; later data effects read the retained instance without replacing it.

The browser journey proves initial drawing, retained data and resize updates,
listener removal, enhanced route disposal, fresh remount, and static-route package
exclusion. Chart.js owns the canvas drawing surface; Kudzu owns only the route,
state, refs, and effect lifetime.
