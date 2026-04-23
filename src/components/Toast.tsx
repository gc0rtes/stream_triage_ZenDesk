/* eslint-disable react-refresh/only-export-components -- hook + provider pair */
import { useState, useCallback, useContext, createContext, useEffect } from 'react'
import type { ReactNode } from 'react'

type ToastVariant = 'success' | 'error'

interface ToastItem {
  id: number
  variant: ToastVariant
  ticketId?: number
  status?: string
  message?: string
}

interface ToastCtx {
  showToast: (ticketId: number, status: string) => void
  showErrorToast: (message: string) => void
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {}, showErrorToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

function ToastBubble({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 4000)
    return () => window.clearTimeout(t)
  }, [onDone])

  const isErr = item.variant === 'error'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: 'oklch(0.22 0.01 240)',
      borderRadius: 8,
      border: '1px solid oklch(0.38 0.02 240)',
      borderLeft: `4px solid ${isErr ? 'var(--danger)' : 'var(--accent)'}`,
      padding: '13px 20px',
      fontSize: 13, color: 'oklch(0.95 0.01 240)',
      fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      animation: 'slideIn 0.18s ease-out',
      pointerEvents: 'none',
      maxWidth: 'min(92vw, 520px)',
      whiteSpace: 'pre-wrap',
    }}>
      <span style={{ color: isErr ? 'var(--danger)' : 'var(--accent)', fontSize: 16, fontWeight: 700 }}>
        {isErr ? '✕' : '✓'}
      </span>
      <span>
        {isErr ? (
          item.message
        ) : (
          <>
            Ticket <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>#{item.ticketId}</span>
            {' '}submitted as <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.status}</span>
            {' '}· reply sent
          </>
        )}
      </span>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((ticketId: number, status: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, variant: 'success', ticketId, status }])
  }, [])

  const showErrorToast = useCallback((message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, variant: 'error', message }])
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast, showErrorToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <ToastBubble key={t.id} item={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
