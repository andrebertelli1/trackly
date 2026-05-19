'use client'

import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { RowActions } from '@/components/RowActions'
import { useToast } from '@/components/Toast'
import { deleteSchool } from './actions'
import type { School } from '@/lib/supabase'

const COL = '1.4fr 120px 100px 100px 56px'

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
      letterSpacing: '0.09em', color: 'rgba(22,20,15,0.38)',
      padding: '10px 10px 10px 0', textAlign: align as 'left' | 'right',
    }}>
      {children}
    </div>
  )
}

export function SchoolsTable({ schools }: { schools: School[] }) {
  const [items, setItems] = useState(schools)
  const [, startTransition] = useTransition()
  const toast = useToast()

  const handleDelete = (id: string, name: string) => {
    setItems(cur => cur.filter(s => s.id !== id))
    startTransition(async () => {
      try {
        await deleteSchool(id)
        toast.success('Escola removida', name)
      } catch {
        setItems(schools)
        toast.error('Falha ao remover escola', name)
      }
    })
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 640 }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: COL, background: '#F4F2EC', borderBottom: '1px solid rgba(20,16,10,0.08)', padding: '0 16px' }}>
          <Th>Escola</Th>
          <Th>Rotas Vinculadas</Th>
          <Th>Alunos</Th>
          <Th>Status</Th>
          <Th align="right"> </Th>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>
            Nenhuma escola cadastrada.
          </div>
        ) : items.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: 'grid', gridTemplateColumns: COL,
              alignItems: 'center', padding: '10px 16px',
              borderBottom: i < items.length - 1 ? '1px solid rgba(20,16,10,0.08)' : 'none',
              minHeight: 44, transition: 'background 100ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F4F2EC')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ paddingRight: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#16140F' }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(22,20,15,0.58)', marginTop: 1 }}>{s.city}{s.state ? `, ${s.state}` : ''}</div>
            </div>
            <div style={{ paddingRight: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 26, height: 22, padding: '0 7px', borderRadius: 6,
                background: '#F4F2EC', border: '1px solid rgba(20,16,10,0.08)',
                fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
              }}>
                {/* routes count not in schema, show placeholder */}
                —
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(22,20,15,0.58)', paddingRight: 10 }}>—</div>
            <div><StatusBadge status="Active" /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <RowActions
                onDelete={() => handleDelete(s.id, s.name)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
