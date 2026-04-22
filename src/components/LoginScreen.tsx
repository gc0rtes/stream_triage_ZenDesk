import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      await login(email.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'oklch(14% 0.01 240)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        background: 'oklch(18% 0.01 240)',
        border: '1px solid oklch(26% 0.01 240)',
        borderRadius: 12,
        padding: '36px 40px',
        width: 360,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'oklch(70% 0.18 145)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'oklch(15% 0.01 145)', fontWeight: 800, fontSize: 18,
            fontFamily: 'monospace',
            flexShrink: 0,
          }}>T</div>
          <span style={{
            fontWeight: 700, fontSize: 20, letterSpacing: -0.3,
            color: 'oklch(92% 0.01 240)',
          }}>Triage</span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'oklch(92% 0.01 240)', marginBottom: 4 }}>
            Sign in to continue
          </div>
          <div style={{ fontSize: 13, color: 'oklch(58% 0.01 240)' }}>
            Your Zendesk email address
          </div>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus
              disabled={loading}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'oklch(22% 0.01 240)',
                border: `1px solid ${error ? 'oklch(60% 0.18 25)' : 'oklch(30% 0.01 240)'}`,
                borderRadius: 6,
                padding: '10px 12px',
                color: 'oklch(92% 0.01 240)',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'oklch(70% 0.18 145)' }}
              onBlur={e => { e.currentTarget.style.borderColor = error ? 'oklch(60% 0.18 25)' : 'oklch(30% 0.01 240)' }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 14, padding: '8px 12px',
              background: 'oklch(22% 0.06 25)',
              border: '1px solid oklch(40% 0.12 25)',
              borderRadius: 6,
              fontSize: 12, color: 'oklch(70% 0.15 25)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: loading || !email.trim() ? 'oklch(50% 0.12 145)' : 'oklch(70% 0.18 145)',
              color: 'oklch(15% 0.01 145)',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !email.trim() ? 'default' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading && (
              <span style={{
                width: 14, height: 14,
                border: '2px solid oklch(15% 0.01 145)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
            )}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
