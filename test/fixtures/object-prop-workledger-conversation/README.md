# WorkLedger Conversation Object Prop Baseline

## Provenance

- Repository: <https://github.com/gruberb/workledger>
- Revision: `3d8bf2130ec1d7698bff07fb00726b2bb94d20d4`
- Revision date: `2026-04-21T09:47:51-03:00`
- Git archive SHA-256: `0a654dd870a20d8a0f1a55eebc238f8be6b172f893a649121417d3d5ca210daa`
- License: MIT, Copyright (c) 2025 Bastian Gruber
- License SHA-256: `5d7c22f930bc9876ff30eca0bc1aaf880490885f73a94bf4f7a95a5fa0f62aab`
- State owner: [`useAIConversation.ts`](https://github.com/gruberb/workledger/blob/3d8bf2130ec1d7698bff07fb00726b2bb94d20d4/src/features/ai/hooks/useAIConversation.ts#L12-L16), SHA-256 `dadea514d19c1af75c3000078305d8c1e027c175c8741d68e8fd239673ba222b`
- Propagation site: [`AISidebar.tsx`](https://github.com/gruberb/workledger/blob/3d8bf2130ec1d7698bff07fb00726b2bb94d20d4/src/features/ai/components/AISidebar.tsx#L253-L263), SHA-256 `1793dfea3a134d995146ebd96b5ee755d78eb083e755c71798fa07377bda167c`
- Consumer: [`AIConversation.tsx`](https://github.com/gruberb/workledger/blob/3d8bf2130ec1d7698bff07fb00726b2bb94d20d4/src/features/ai/components/AIConversation.tsx#L35-L65), SHA-256 `c30d56375da65489c819cbcc04f50a0e6c0db5a8c1085ddd87d68c90134e4208`
- Object type: [`ai.ts`](https://github.com/gruberb/workledger/blob/3d8bf2130ec1d7698bff07fb00726b2bb94d20d4/src/features/ai/types/ai.ts#L35-L51), SHA-256 `39a1a2588b1fbf78cd3c644a7041c5fcf7a432103111ac4f7fa3b8cf6e73d659`

## Reduction

WorkLedger owns one nullable `AIConversation` object state in a component-called
hook, passes the narrowed object intact from `AISidebar` to `AIConversation`,
uses `conversation.messages` as an effect dependency, and maps that collection
into keyed message components. Updates replace the conversation immutably.

The reduction moves the state directly into the page and removes AI providers,
streaming, storage, callbacks, and styling. It preserves one logical object,
immutable replacement, the ordinary component prop, selected-property effect,
keyed collection, and a scalar field binding. Repeated and conditional
instances, cleanup counters, a static sibling, and controls for same-messages
versus replaced-messages updates provide the Session 05A ownership journey.

The current compiler fails before output at the child property dependency:

```text
src/ConversationView.tsx:11:3 useEffect() item-property dependencies are only supported in direct keyed row components
```

Flattening `ConversationView` into the page or decomposing `conversation` into
primitive and array props avoids this failure, but both are artificial migration
workarounds. Session 05B must preserve the authored object and static property
path instead.

## Browser Acceptance After 05B

1. Initial render owns three independent views and three message effects.
2. Rename replaces the parent object while retaining `messages`; every label
   updates, message nodes retain identity, and no message effect reruns.
3. Add message replaces `messages`; every effect cleans up then reruns once,
   retained message nodes keep identity, and the new keyed row appears.
4. Toggle removal cleans up only the conditional owner. Remount creates fresh
   DOM/effect ownership without changing the two retained views.
5. Document disposal cleans every remaining effect exactly once.
6. `/static` emits no JavaScript.
