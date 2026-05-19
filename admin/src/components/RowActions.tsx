'use client'

import { useEffect, useRef, useState } from 'react'

export function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8, border: 0,
          background: open ? 'rgba(20,16,10,0.06)' : 'transparent',
          color: 'rgba(22,20,15,0.38)', cursor: 'pointer', fontSize: 16, letterSpacing: 2,
        }}
        aria-label="Ações da linha"
      >
        •••
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: '#fff', border: '1px solid rgba(20,16,10,0.14)',
          borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
          padding: 4, minWidth: 140, zIndex: 50,
        }}>
          {onEdit && (
            <button
              type="button"
              onClick={() => { setOpen(false); onEdit() }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', borderRadius: 6, border: 0, background: 'transparent', fontSize: 12.5, color: '#16140F', textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F4F2EC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20 H8 L19 9 L15 5 L4 16 Z" /><path d="M13 7 L17 11" />
              </svg>
              Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => { setOpen(false); onDelete() }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px', borderRadius: 6, border: 0, background: 'transparent', fontSize: 12.5, color: '#D04F3C', textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(208,79,60,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7 H20"/><path d="M6 7 V19 C6 20 7 20.5 8 20.5 H16 C17 20.5 18 20 18 19 V7"/>
                <path d="M9 7 V5 C9 4 10 3.5 11 3.5 H13 C14 3.5 15 4 15 5 V7"/>
              </svg>
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  )
}
