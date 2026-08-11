export function createComponentAnalysis(file) {
  return { version: 2, file, owners: [], specializations: [] }
}

export function createComponentAnalysisSession(analysis) {
  const owners = new WeakMap()

  function registerOwner(identity, descriptor = {}) {
    let owner = owners.get(identity)
    if (!owner) {
      owner = { slot: analysis.owners.length, kind: descriptor.kind ?? "component", name: descriptor.name ?? "anonymous", props: descriptor.props ?? [], states: [], setters: [], refs: [], ids: [], ...(descriptor.site ? { site: descriptor.site } : {}), ...(descriptor.source ? { source: descriptor.source } : {}) }
      owners.set(identity, owner)
      analysis.owners.push(owner)
    }
    return owner
  }

  function registerState(identity, descriptor) {
    const owner = owners.get(identity)
    if (!owner) throw new Error("Component owner must be registered before its state")
    let state = owner.states.find(entry => entry.name === descriptor.name && entry.owner === descriptor.owner)
    if (!state) {
      state = { slot: owner.states.length, name: descriptor.name, kind: descriptor.kind, ...(descriptor.owner ? { owner: descriptor.owner } : {}), ...(descriptor.site ? { site: descriptor.site } : {}), ...(descriptor.source ? { source: descriptor.source } : {}) }
      owner.states.push(state)
    }
    if (descriptor.setter && !owner.setters.some(entry => entry.name === descriptor.setter)) owner.setters.push({ name: descriptor.setter, signal: state.slot, kind: descriptor.kind })
    return state
  }

  function registerRef(identity, descriptor) {
    const owner = owners.get(identity)
    if (!owner) throw new Error("Component owner must be registered before its ref")
    if (!owner.refs.some(entry => entry.name === descriptor.name)) owner.refs.push({ slot: owner.refs.length, ...descriptor })
  }

  function registerId(identity, descriptor) {
    const owner = owners.get(identity)
    if (!owner) throw new Error("Component owner must be registered before its ID")
    if (!owner.ids.some(entry => entry.name === descriptor.name)) owner.ids.push({ slot: owner.ids.length, ...descriptor })
  }

  function registerSpecialization(descriptor) {
    const specialization = {
      slot: analysis.specializations.length,
      ...descriptor,
      states: (descriptor.states ?? []).map((state, slot) => ({ slot, ...state })),
      refs: (descriptor.refs ?? []).map((ref, slot) => ({ slot, ...ref })),
      ids: (descriptor.ids ?? []).map((id, slot) => ({ slot, ...id }))
    }
    analysis.specializations.push(specialization)
    return specialization
  }

  return { owner: identity => owners.get(identity), registerId, registerOwner, registerRef, registerSpecialization, registerState }
}
