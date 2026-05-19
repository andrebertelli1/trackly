export const revalidate = 30

import { getDriverProfiles, getRoutesBasic, getDriverCandidates } from '@/lib/queries'
import { StatusBadge } from '@/components/StatusBadge'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { PromoteDriverDialog } from './PromoteDriverDialog'
import { DriversActions } from './DriversActions'
import type { Profile } from '@/lib/supabase'

const COL = '1.4fr 1fr 140px 118px 104px 56px'

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

export default async function DriversPage() {
  const [drivers, routes, candidates] = await Promise.all([getDriverProfiles(), getRoutesBasic(), getDriverCandidates()])

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Motoristas</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>
              Gerencie usuários com perfil de motorista. {drivers.length} motorista{drivers.length !== 1 ? 's' : ''} cadastrado{drivers.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <PromoteDriverDialog candidates={candidates} />
        </header>

        {/* Table or empty state */}
        <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          {drivers.length === 0 ? (
            <EmptyState
              icon={
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.5"/><path d="M4.5 20 C4.5 16 8 14 12 14 C16 14 19.5 16 19.5 20"/>
                </svg>
              }
              title="Nenhum motorista cadastrado"
              description="Promova um usuário registrado a motorista para começar a atribuir rotas. Motoristas podem aceitar viagens pelo app após a promoção."
              action={<PromoteDriverDialog candidates={candidates} />}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 760 }}>
                {/* Head */}
                <div style={{ display: 'grid', gridTemplateColumns: COL, background: '#F4F2EC', borderBottom: '1px solid rgba(20,16,10,0.08)', padding: '0 16px' }}>
                  <Th>Motorista</Th>
                  <Th>Telefone</Th>
                  <Th>Rotas ativas</Th>
                  <Th>Desde</Th>
                  <Th>Status</Th>
                  <Th align="right"> </Th>
                </div>

                {/* Body */}
                {drivers.map((d, i) => {
                  const driver = d as Profile & { since?: string; status?: string }
                  const myRoutes = routes.filter(r => r.driver_id === d.id)
                  const status = driver.status ?? 'Active'
                  const since = driver.since ?? '—'

                  return (
                    <div
                      key={d.id}
                      className="hover:bg-surface-alt"
                    style={{
                        display: 'grid', gridTemplateColumns: COL,
                        alignItems: 'center', padding: '10px 16px',
                        borderBottom: i < drivers.length - 1 ? '1px solid rgba(20,16,10,0.08)' : 'none',
                        minHeight: 44, transition: 'background 100ms',
                      }}
                    >
                      {/* Driver */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                        <Avatar name={d.full_name ?? '?'} size={28} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.full_name}</div>
                          {driver.email && <div style={{ fontSize: 11.5, color: 'rgba(22,20,15,0.58)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.email}</div>}
                        </div>
                      </div>
                      {/* Phone */}
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)', paddingRight: 10 }}>
                        {d.phone ?? '—'}
                      </div>
                      {/* Active routes pills */}
                      <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', paddingRight: 10 }}>
                        {myRoutes.length === 0 ? (
                          <span style={{ color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>—</span>
                        ) : myRoutes.map(rt => (
                          <span key={rt.id} style={{
                            display: 'inline-flex', alignItems: 'center',
                            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            padding: '2px 7px', borderRadius: 5, border: `1px solid ${rt.van_color || '#3A5BD9'}`,
                            color: rt.van_color || '#3A5BD9', letterSpacing: '0.02em',
                          }}>
                            {rt.van_label}
                          </span>
                        ))}
                      </div>
                      {/* Since */}
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)' }}>{since}</div>
                      {/* Status */}
                      <div><StatusBadge status={status} /></div>
                      {/* Actions */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <DriversActions driverId={d.id} driverName={d.full_name ?? ''} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
