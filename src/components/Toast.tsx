import { useState, useCallback, useContext, createContext } from 'react'
import type { ReactNode } from 'react'

interface ToastItem {
  id: number
  ticketId: number
  status: string
}

interface ToastCtx {
  showToast: (ticketId: number, status: string) => void
}

const ToastContext = createContext<ToastCtx>({ showToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

function ToastBubble({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  // auto-dismiss after 4s
  useState(() => { setTimeout(onDone, 4000) })

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: 'oklch(0.22 0.01 240)',
      borderRadius: 8,
      border: '1px solid oklch(0.38 0.02 240)',
      borderLeft: '4px solid var(--accent)',
      padding: '13px 20px',
      fontSize: 13, color: 'oklch(0.95 0.01 240)',
      fontWeight: 500,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      animation: 'slideIn 0.18s ease-out',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>✓</span>
      <span>
        Ticket <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>#{item.ticketId}</span>
        {' '}submitted as <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.status}</span>
        {' '}· reply sent
      </span>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((ticketId: number, status: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, ticketId, status }])
  }, [])

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
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
