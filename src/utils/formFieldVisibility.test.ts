import { describe, it, expect } from 'vitest'
import { isCustomFieldVisibleForAgent } from './formFieldVisibility'

describe('isCustomFieldVisibleForAgent', () => {
  const conditions = [
    {
      parent_field_id: 100,
      value: 'billing',
      child_fields: [{ id: 200 }, { id: 201 }],
    },
  ]

  it('shows non-child fields always', () => {
    expect(isCustomFieldVisibleForAgent(50, conditions, () => null)).toBe(true)
  })

  it('hides child when parent value does not match', () => {
    expect(isCustomFieldVisibleForAgent(200, conditions, () => 'other')).toBe(false)
  })

  it('shows child when parent value matches', () => {
    expect(isCustomFieldVisibleForAgent(200, conditions, fid => (fid === 100 ? 'billing' : null))).toBe(true)
  })

  it('shows all when no conditions', () => {
    expect(isCustomFieldVisibleForAgent(200, undefined, () => null)).toBe(true)
  })
})
