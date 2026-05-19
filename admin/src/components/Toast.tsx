'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type Tone = 'success' | 'danger' | 'info'
interface Toast { id: string; tone: Tone; msg: string; sub?: string }
interface ToastApi {
  success: (msg: string, sub?: string) => void
  error: (msg: string, sub?: string) => void
  info: (msg: string, sub?: string) => void
}

const Ctx = createContext<ToastApi | null>(null)

const BORDER: Record<Tone, string> = {
  success: '#1F8A5B',
  danger: '#D04F3C',
  info: 'rgba(22,20,15,0.38)',
}
const ICON: Record<Tone, string> = { success: '✓', danger: '✕', info: '·' }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((tone: Tone, msg: string, sub?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(cur => [...cur, { id, tone, msg, sub }])
    setTimeout(() => setToasts(cur => cur.filter(t => t.id !== id)), 3000)
  }, [])

  const api = useMemo<ToastApi>(() => ({
    success: (msg, sub) => push('success', msg, sub),
    error: (msg, sub) => push('danger', msg, sub),
    info: (msg, sub) => push('info', msg, sub),
  }), [push])

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[300]">
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '18px 1fr',
              gap: 10,
              background: '#fff',
              border: '1px solid rgba(20,16,10,0.14)',
              borderLeftWidth: 3,
              borderLeftColor: BORDER[t.tone],
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              padding: '11px 14px',
              minWidth: 240,
              maxWidth: 360,
            }}
          >
            <span style={{ color: BORDER[t.tone], marginTop: 1, fontWeight: 700 }}>{ICON[t.tone]}</span>
            <div>
              <div className="text-[13px] font-semibold text-ink">{t.msg}</div>
              {t.sub && <div className="text-[12px] text-ink-muted mt-0.5">{t.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
