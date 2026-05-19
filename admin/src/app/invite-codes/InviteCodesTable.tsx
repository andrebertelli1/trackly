'use client'

import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { RowActions } from '@/components/RowActions'
import { useToast } from '@/components/Toast'
import { revokeCode } from './actions'

interface InviteCodeRow {
  code: string
  expires_at: string
  max_redemptions: number
  created_at: string
  route_label?: string
  route_color?: string
  kids: { full_name: string } | null
  redemption_count: number
  status?: string
}

const COL = '1.6fr 1fr 1fr 1fr 1.2fr 120px 56px'

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

function CodeChip({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
        letterSpacing: '0.04em', background: '#F4F2EC',
        border: '1px solid rgba(20,16,10,0.10)', borderRadius: 6,
        padding: '3px 8px', color: '#16140F',
      }}>
        {code}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title="Copy code"
        style={{
          width: 24, height: 24, borderRadius: 6,
          border: '1px solid rgba(20,16,10,0.10)',
          background: copied ? 'rgba(31,138,91,0.10)' : '#fff',
          color: copied ? '#1F8A5B' : 'rgba(22,20,15,0.38)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 120ms',
        }}
      >
        {copied ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5 L10 17 L19 7"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
    </div>
  )
}

function UsesBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
  const full = used >= max

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: 'rgba(20,16,10,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: full ? '#D04F3C' : '#3A5BD9',
            width: `${pct}%`,
            transition: 'width 300ms',
          }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(22,20,15,0.58)', whiteSpace: 'nowrap' }}>
          {used} / {max}
        </span>
      </div>
    </div>
  )
}

function fmt(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function RowItem({ row, isLast }: { row: InviteCodeRow; isLast: boolean }) {
  const [, startTransition] = useTransition()
  const toast = useToast()
  const routeLabel = row.route_label ?? row.kids?.full_name ?? '—'
  const routeColor = row.route_color ?? '#3A5BD9'

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: COL,
        alignItems: 'center', padding: '10px 16px',
        borderBottom: isLast ? 'none' : '1px solid rgba(20,16,10,0.08)',
        minHeight: 44, transition: 'background 100ms',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F4F2EC')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Code */}
      <div style={{ paddingRight: 10 }}>
        <CodeChip code={row.code} />
      </div>

      {/* Route */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: routeColor, flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: routeColor, letterSpacing: '0.02em' }}>
          {routeLabel}
        </span>
      </div>

      {/* Created */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)', paddingRight: 10 }}>
        {fmt(row.created_at)}
      </div>

      {/* Expires */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)', paddingRight: 10 }}>
        {fmt(row.expires_at)}
      </div>

      {/* Uses */}
      <div style={{ paddingRight: 10 }}>
        <UsesBar used={row.redemption_count} max={row.max_redemptions} />
      </div>

      {/* Status */}
      <div>
        <StatusBadge status={row.status ?? 'Active'} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <RowActions
          onDelete={() => {
            startTransition(async () => {
              try {
                await revokeCode(row.code)
                toast.success('Código revogado', row.code)
              } catch {
                toast.error('Falha ao revogar código', row.code)
              }
            })
          }}
        />
      </div>
    </div>
  )
}

export function InviteCodesTable({ rows }: { rows: InviteCodeRow[] }) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>
        Nenhum código gerado ainda. Gere um para começar.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 820 }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: COL, background: '#F4F2EC', borderBottom: '1px solid rgba(20,16,10,0.08)', padding: '0 16px' }}>
          <Th>Código</Th>
          <Th>Rota</Th>
          <Th>Criado em</Th>
          <Th>Expira em</Th>
          <Th>Usos</Th>
          <Th>Status</Th>
          <Th align="right"> </Th>
        </div>

        {/* Body */}
        {rows.map((row, i) => (
          <RowItem key={row.code} row={row} isLast={i === rows.length - 1} />
        ))}
      </div>
    </div>
  )
}
