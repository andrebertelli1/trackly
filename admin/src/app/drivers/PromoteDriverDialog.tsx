'use client'

import { useState, useTransition } from 'react'
import { Avatar } from '@/components/Avatar'
import { useToast } from '@/components/Toast'
import { promoteToDriver } from './actions'
import { mockPromotionCandidates } from '@/lib/mock'
import type { Profile } from '@/lib/supabase'

interface Candidate {
  id: string
  full_name: string | null
  email?: string
  phone?: string | null
  since?: string
  role: string
}

export function PromoteDriverDialog({ candidates = mockPromotionCandidates }: { candidates?: Candidate[] }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [, startTransition] = useTransition()
  const toast = useToast()

  const results = candidates.filter(c =>
    ((c.full_name ?? '') + ' ' + (c.email ?? '')).toLowerCase().includes(q.toLowerCase())
  )

  const handleOpen = () => { setOpen(true); setQ(''); setSelected(null) }
  const handleClose = () => setOpen(false)

  const handlePromote = () => {
    if (!selected) return
    startTransition(async () => {
      try {
        await promoteToDriver(selected.id)
        toast.success('Usuário promovido', `${selected.full_name} agora é motorista.`)
        setOpen(false)
      } catch {
        toast.error('Falha ao promover usuário')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: '1px solid transparent', background: '#3A5BD9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>
        Promover usuário
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,20,15,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }} onMouseDown={handleClose}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.08)', width: 520, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onMouseDown={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '18px 20px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.005em' }}>Promover usuário a motorista</div>
                <div style={{ fontSize: 12.5, color: 'rgba(22,20,15,0.58)', marginTop: 3, lineHeight: 1.4 }}>Busque um usuário registrado pelo nome ou e-mail. Ele receberá permissões de motorista após a confirmação.</div>
              </div>
              <button type="button" onClick={handleClose} style={{ width: 28, height: 28, borderRadius: 8, border: 0, background: 'transparent', color: 'rgba(22,20,15,0.38)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6 L18 18"/><path d="M18 6 L6 18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '18px 20px', overflow: 'auto' }}>
              {/* Search */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', background: '#fff', border: '1px solid rgba(20,16,10,0.14)', borderRadius: 10, padding: '0 10px', height: 40, color: 'rgba(22,20,15,0.38)', marginBottom: 12 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16 L20.5 20.5"/></svg>
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="email@domain.com"
                  autoFocus
                  style={{ border: 0, background: 'transparent', outline: 'none', padding: '0 8px', fontSize: 13, color: '#16140F', width: '100%' }}
                />
              </div>

              {/* Results list */}
              <div style={{ border: '1px solid rgba(20,16,10,0.08)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                {results.length === 0 ? (
                  <div style={{ padding: 14, color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>Nenhum usuário encontrado.</div>
                ) : results.map(c => {
                  const isSelected = selected?.id === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelected(c)}
                      style={{
                        display: 'grid', gridTemplateColumns: 'auto 1fr auto 24px',
                        gap: 12, alignItems: 'center', width: '100%',
                        border: 0, background: isSelected ? 'rgba(58,91,217,0.10)' : '#fff',
                        padding: '11px 12px', borderBottom: '1px solid rgba(20,16,10,0.08)',
                        textAlign: 'left', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F4F2EC' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(58,91,217,0.10)' : '#fff' }}
                    >
                      <Avatar name={c.full_name ?? '?'} size={36} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.full_name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(22,20,15,0.58)' }}>{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
                      </div>
                      {c.since && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(22,20,15,0.58)' }}>since {c.since}</span>}
                      <span style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: `1px solid ${isSelected ? '#3A5BD9' : 'rgba(20,16,10,0.14)'}`,
                        background: isSelected ? '#3A5BD9' : '#fff',
                        color: isSelected ? '#fff' : 'transparent',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 L10 17 L19 7"/></svg>}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Warning */}
              {selected && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: 'rgba(245,165,36,0.14)', borderRadius: 8, padding: '9px 11px', color: '#7A4F0E' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 L21 19 H3 Z"/><path d="M12 10 V14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/></svg>
                  <span>Isso concede a <strong>{selected.full_name}</strong> acesso às ferramentas de motorista e atribuições de rota.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid rgba(20,16,10,0.08)', background: '#F4F2EC' }}>
              <button type="button" onClick={handleClose} style={{ padding: '8px 13px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#16140F', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePromote}
                disabled={!selected}
                style={{ padding: '8px 13px', borderRadius: 10, border: '1px solid transparent', background: '#3A5BD9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.4 }}
              >
                Confirmar promoção
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
