export const revalidate = 30

import { getDashboardStats, getDashboardRecentRoutes, getDashboardSchools, getDashboardRecentCodes } from '@/lib/queries'
import { mockActivity } from '@/lib/mock'
import { StatusBadge } from '@/components/StatusBadge'
import { Avatar } from '@/components/Avatar'
import Link from 'next/link'

const periodLabel: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde' }

export default async function DashboardPage() {
  const [stats, routes, schools, codes] = await Promise.all([
    getDashboardStats(),
    getDashboardRecentRoutes(),
    getDashboardSchools(),
    getDashboardRecentCodes(),
  ])
  const now = new Date()

  const kpis = [
    { label: 'Escolas',     value: stats.schools,  delta: '+1 esta semana', deltaTone: 'success', hint: `${stats.schools} ativas` },
    { label: 'Rotas',       value: stats.routes,   delta: 'nas escolas',    deltaTone: 'muted',   hint: `${stats.routes} no total` },
    { label: 'Alunos',      value: stats.students, delta: 'matriculados',   deltaTone: 'success', hint: 'nas rotas' },
    { label: 'Motoristas',  value: stats.drivers,  delta: 'motoristas',     deltaTone: 'muted',   hint: 'com perfil driver' },
  ]

  const deltaBg: Record<string, string> = {
    success: 'rgba(31,138,91,0.12)',
    muted: 'rgba(20,16,10,0.07)',
    warm: 'rgba(245,165,36,0.14)',
  }
  const deltaColor: Record<string, string> = {
    success: '#1F8A5B',
    muted: 'rgba(22,20,15,0.58)',
    warm: '#B5751A',
  }

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Page header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 4 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, color: '#16140F' }}>Visão Geral</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>
              Panorama operacional
            </p>
          </div>
        </header>

        {/* KPI grid */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background: '#fff', border: '1px solid rgba(20,16,10,0.08)',
              borderRadius: 16, padding: '16px 18px 14px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>
                {k.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>
                {k.value}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11.5, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                <span style={{
                  fontWeight: 600, padding: '2px 7px', borderRadius: 5, fontSize: 11,
                  background: deltaBg[k.deltaTone], color: deltaColor[k.deltaTone],
                }}>
                  {k.delta}
                </span>
                <span style={{ color: 'rgba(22,20,15,0.38)', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                  {k.hint}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Route board + Activity */}
        <section style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 14 }}>

          {/* Live route board */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Rotas de hoje</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Painel ao vivo</div>
              </div>
              <Link href="/routes" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#16140F', textDecoration: 'none' }}>
                Ver todas
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 L15 12 L9 18" /></svg>
              </Link>
            </div>

            {/* Mini table */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 560 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1.3fr 90px 1.1fr 110px 100px', background: '#F4F2EC', borderBottom: '1px solid rgba(20,16,10,0.08)', padding: '0 16px' }}>
                  {['Van', 'Escola', 'Turno', 'Motorista', 'Janela', 'Status'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(22,20,15,0.38)', padding: '10px 10px 10px 0' }}>{h}</div>
                  ))}
                </div>
                {routes.map((r, i) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const route = r as any
                  const driver = route.profiles
                  const routeColor = route.van_color || '#3A5BD9'
                  const shift = periodLabel[route.period] ?? route.period
                  return (
                    <div key={route.id} style={{
                      display: 'grid', gridTemplateColumns: '80px 1.3fr 90px 1.1fr 110px 100px',
                      alignItems: 'center', padding: '10px 16px',
                      borderBottom: i < routes.length - 1 ? '1px solid rgba(20,16,10,0.08)' : 'none',
                      minHeight: 44,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: routeColor, flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{route.van_label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>{route.schools?.name ?? '—'}</span>
                      <span style={{ fontSize: 13, color: 'rgba(22,20,15,0.58)' }}>{shift}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                        {driver?.full_name ? (
                          <>
                            <Avatar name={driver.full_name} color={routeColor} size={22} />
                            <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.full_name}</span>
                          </>
                        ) : <span style={{ fontSize: 13, color: 'rgba(22,20,15,0.38)' }}>Não atribuído</span>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)' }}>
                        {route.pickup_start?.slice(0,5) ?? '—'}→{route.arrival_time?.slice(0,5) ?? '—'}
                      </span>
                      <StatusBadge status="Active" />
                    </div>
                  )
                })}
                {routes.length === 0 && (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>
                    Nenhuma rota encontrada.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Atividade recente</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Últimas 24 h</div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '4px 6px' }}>
              {mockActivity.map((a) => (
                <li key={a.id} style={{
                  display: 'grid', gridTemplateColumns: '12px 1fr auto',
                  alignItems: 'start', gap: 11, padding: '11px 12px',
                  borderBottom: '1px dashed rgba(20,16,10,0.08)',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 999, marginTop: 5, flexShrink: 0,
                    background: a.kind === 'student' ? '#3A5BD9' : a.kind === 'code' ? '#F5A524' : a.kind === 'route' ? '#1F8A5B' : '#9148C9',
                    display: 'block',
                  }} />
                  <span style={{ fontSize: 12.5, color: '#16140F', lineHeight: 1.45 }}>{a.text}</span>
                  <span style={{ fontSize: 11, color: 'rgba(22,20,15,0.38)', whiteSpace: 'nowrap' }}>{a.ago}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Schools capacity + Invite codes */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* Schools capacity */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Escolas</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Capacidade por unidade</div>
              </div>
              <Link href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#16140F', textDecoration: 'none' }}>
                Gerenciar
              </Link>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {schools.map(s => {
                const pct = Math.min(100, 55 + Math.round(Math.random() * 40))
                return (
                  <li key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <div style={{ background: '#F4F2EC', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#3A5BD9', borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(22,20,15,0.58)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {s.city}
                    </span>
                  </li>
                )
              })}
              {schools.length === 0 && (
                <li style={{ color: 'rgba(22,20,15,0.38)', fontSize: 13, padding: '8px 0' }}>Nenhuma escola cadastrada.</li>
              )}
            </ul>
          </div>

          {/* Invite codes redemption */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Convites</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Status de resgates</div>
              </div>
              <Link href="/invite-codes" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#16140F', textDecoration: 'none' }}>
                Gerenciar
              </Link>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {codes.map((c) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const code = c as any
                const expired = new Date(code.expires_at) <= now
                const redemptions = code.redemption_count ?? 0
                const max = code.max_redemptions ?? 2
                const full = redemptions >= max
                const status = expired ? 'Expired' : full ? 'Exhausted' : 'Active'
                return (
                  <li key={code.code} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 10, alignItems: 'center', padding: '9px 8px', borderRadius: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700,
                      background: '#F4F2EC', border: '1px solid rgba(20,16,10,0.08)',
                      padding: '4px 9px', borderRadius: 6, letterSpacing: '0.02em',
                    }}>
                      {code.code}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(22,20,15,0.58)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {code.kids?.full_name ?? '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(22,20,15,0.58)' }}>
                      {redemptions}/{max}
                    </span>
                    <StatusBadge status={status} />
                  </li>
                )
              })}
              {codes.length === 0 && (
                <li style={{ color: 'rgba(22,20,15,0.38)', fontSize: 13, padding: '8px 0' }}>Nenhum convite gerado.</li>
              )}
            </ul>
          </div>
        </section>

      </div>
    </div>
  )
}
