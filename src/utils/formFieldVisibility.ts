import type { CustomFieldValue, ZDTicketFormAgentCondition } from '../api/tickets'

function isListedChild(
  fieldId: number,
  conditions: ZDTicketFormAgentCondition[] | undefined,
): boolean {
  if (!conditions?.length) return false
  return conditions.some((c) => c.child_fields.some((ch) => ch.id === fieldId))
}

function parentMatches(
  parentFieldId: number,
  expected: string,
  effectiveValue: (fieldId: number) => CustomFieldValue['value'] | undefined,
): boolean {
  const v = effectiveValue(parentFieldId)
  return String(v ?? '') === String(expected)
}

/** Fields not listed as children in any agent condition are always shown. */
export function isCustomFieldVisibleForAgent(
  fieldId: number,
  agentConditions: ZDTicketFormAgentCondition[] | undefined,
  effectiveValue: (fieldId: number) => CustomFieldValue['value'] | undefined,
): boolean {
  if (!agentConditions?.length) return true
  if (!isListedChild(fieldId, agentConditions)) return true
  return agentConditions.some(
    (c) =>
      c.child_fields.some((ch) => ch.id === fieldId) &&
      parentMatches(c.parent_field_id, c.value, effectiveValue),
  )
}
