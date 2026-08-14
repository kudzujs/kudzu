import { createHash } from "node:crypto"
import { assertRouteBuildRecord } from "./route-build-record.mjs"
import { planRouteCapabilities } from "./route-capability-planner.mjs"

export function capabilitySignature(capability) {
  return createHash("sha256").update(JSON.stringify(capability)).digest("hex")
}

export function planRuntimeFamilies(records, navigationGroups = []) {
  for (const record of records) assertRouteBuildRecord(record)
  const grouped = new Set()
  const scopes = []
  for (const group of navigationGroups) {
    const groupRecords = group.buildRecords ?? group.records ?? []
    if (!groupRecords.length) continue
    for (const record of groupRecords) {
      if (!records.includes(record)) throw new Error(`Navigation runtime family contains an unknown route: ${record.route}`)
      if (grouped.has(record)) throw new Error(`Route belongs to multiple runtime families: ${record.route}`)
      grouped.add(record)
    }
    scopes.push({ navigation: true, records: groupRecords })
  }
  for (const record of records) if (!grouped.has(record) && record.capabilities.hasBehaviors) scopes.push({ navigation: false, records: [record] })

  const familiesBySignature = new Map()
  const signaturesById = new Map()
  const familyByRecord = new Map()
  for (const scope of scopes) {
    const capability = planRouteCapabilities(scope.records, { navigationRouteCount: scope.navigation ? scope.records.length : 0 })
    const descriptor = { version: 1, navigation: scope.navigation, capability }
    const signature = capabilitySignature(descriptor)
    const id = signature.slice(0, 16)
    const existingSignature = signaturesById.get(id)
    if (existingSignature && existingSignature !== signature) throw new Error(`Runtime family ID collision: ${id}`)
    signaturesById.set(id, signature)
    let family = familiesBySignature.get(signature)
    if (!family) {
      family = { id, signature, navigation: scope.navigation, capability, records: [] }
      familiesBySignature.set(signature, family)
    }
    for (const record of scope.records) {
      family.records.push(record)
      familyByRecord.set(record, family)
    }
  }
  const families = [...familiesBySignature.values()].map(family => ({ ...family, records: [...family.records].sort((left, right) => left.route.localeCompare(right.route)) })).sort((left, right) => left.id.localeCompare(right.id))
  return { families, familyByRecord }
}
