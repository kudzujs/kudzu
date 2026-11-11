# Native SharedWorker ownership

Reduced from Actual Budget `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`:
`packages/loot-core/src/platform/client/browser-preload/start.ts:44-85` creates
a named shared worker, obtains its port and sends `init`/`tab-closing` messages.
The adjacent WorkerBridge starts the port after installing its message listener.

This independent transport regression uses a public JavaScript worker and an
inline owned effect. It is not the original coordinator, a database replacement,
or a claim of full multi-tab Actual migration. The application owns its protocol;
Kudzu only preserves the native constructor and existing cleanup ownership.
Two same-origin documents share one named worker, and removing/remounting a
connection must transfer leadership without closing the surviving port.
