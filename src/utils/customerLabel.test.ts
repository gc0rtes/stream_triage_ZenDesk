import { describe, it, expect } from 'vitest'
import { resolveCustomerLabel } from '../api/tickets'

describe('resolveCustomerLabel', () => {
  it('uses organization name when present', () => {
    expect(resolveCustomerLabel(1, 'Acme Corp', 'a@b.com')).toBe('Acme Corp')
  })

  it('uses corporate domain when no org', () => {
    expect(resolveCustomerLabel(null, undefined, 'x@widgets.io')).toBe('Widgets')
  })

  it('uses consumer brand for gmail', () => {
    expect(resolveCustomerLabel(null, undefined, 'x@gmail.com')).toBe('Gmail')
  })

  it('uses consumer brand for outlook', () => {
    expect(resolveCustomerLabel(null, undefined, 'x@outlook.com')).toBe('Outlook')
  })

  it('falls back to Unknown', () => {
    expect(resolveCustomerLabel(null, undefined, undefined)).toBe('Unknown')
  })
})
