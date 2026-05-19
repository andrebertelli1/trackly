export const revalidate = 30

import { getRoutesWithDetails, getSchools, getDriverProfiles } from '@/lib/queries'
import { StatusBadge } from '@/components/StatusBadge'
import { Avatar } from '@/components/Avatar'
import { RoutesActions } from './RoutesActions'
import { CreateRouteDialog } from './CreateRouteDialog'
import Link from 'next/link'
import type { Route } from '@/lib/supabase'

const periodLabel: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon' }

const COL = '92px 1.4fr 100px 1.2fr 140px 100px 100px 120px 56px'

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

export default async function RoutesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [routes, schools, drivers] = await Promise.all([
    getRoutesWithDetails(),
    getSchools(),
    getDriverProfiles(),
  ])
  const params = await searchParams
  const tab = params.tab ?? 'all'

  const counts = {
    all: routes.length,
    Active: routes.filter(r => (r as unknown as { status?: string }).status === 'Active').length || routes.length,
    Pending: routes.filter(r => (r as unknown as { status?: string }).status === 'Pending').length,
    Inactive: routes.filter(r => (r as unknown as { status?: string }).status === 'Inactive').length,
  }

  const filteredRoutes = tab === 'all'
    ? routes
    : routes.filter(r => (r as unknown as { status?: string }).status === tab)

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Rotas</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>
              Todas as vans, turnos e atribuições nas escolas.
            </p>
          </div>
          <CreateRouteDialog schools={schools} drivers={drivers} />
        </header>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Tab filter client component */}
          <RoutesTabFilter tab={tab} counts={counts} />
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href="/routes" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#16140F', textDecoration: 'none' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5 H20 L14 12 V19 L10 17 V12 Z"/></svg>
              Filtros
            </Link>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 960 }}>
              {/* Head */}
              <div style={{ display: 'grid', gridTemplateColumns: COL, background: '#F4F2EC', borderBottom: '1px solid rgba(20,16,10,0.08)', padding: '0 16px' }}>
                <Th>Van</Th>
                <Th>Escola</Th>
                <Th>Turno</Th>
                <Th>Motorista</Th>
                <Th>Início → Chegada</Th>
                <Th>Alunos</Th>
                <Th>Status</Th>
                <Th> </Th>
                <Th align="right"> </Th>
              </div>

              {/* Body */}
              {filteredRoutes.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>
                  Nenhuma rota encontrada.
                </div>
              ) : filteredRoutes.map((r, i) => {
                const route = r as unknown as Route & { status?: string }
                const color = route.van_color || '#3A5BD9'
                const driver = route.profiles
                const shift = periodLabel[route.period] ?? route.period
                const status = route.status ?? 'Active'

                return (
                  <div
                    key={route.id}
                    className="hover:bg-surface-alt"
                    style={{
                      display: 'grid', gridTemplateColumns: COL,
                      alignItems: 'center', padding: '10px 16px',
                      borderBottom: i < filteredRoutes.length - 1 ? '1px solid rgba(20,16,10,0.08)' : 'none',
                      minHeight: 44, transition: 'background 100ms',
                    }}
                  >
                    {/* Van */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingRight: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{route.van_label}</span>
                    </div>
                    {/* School */}
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>
                      {route.schools?.name ?? '—'}
                    </div>
                    {/* Shift */}
                    <div style={{ fontSize: 13, color: 'rgba(22,20,15,0.58)', paddingRight: 10 }}>{shift}</div>
                    {/* Driver */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10, overflow: 'hidden' }}>
                      {driver?.full_name ? (
                        <>
                          <Avatar name={driver.full_name} color={color} size={24} />
                          <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{driver.full_name}</span>
                        </>
                      ) : <span style={{ fontSize: 13, color: 'rgba(22,20,15,0.38)' }}>Não atribuído</span>}
                    </div>
                    {/* Window */}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, paddingRight: 10 }}>
                      {route.pickup_start?.slice(0,5) ?? '—'}
                      <span style={{ color: 'rgba(22,20,15,0.38)', margin: '0 3px' }}>→</span>
                      {route.arrival_time?.slice(0,5) ?? '—'}
                    </div>
                    {/* Students badge */}
                    <div style={{ paddingRight: 10 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 26, height: 22, padding: '0 7px', borderRadius: 6,
                        background: '#F4F2EC', border: '1px solid rgba(20,16,10,0.08)',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        —
                      </span>
                    </div>
                    {/* Status */}
                    <div style={{ paddingRight: 10 }}><StatusBadge status={status} /></div>
                    {/* Open link */}
                    <div>
                      <Link
                        href={`/routes/${route.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#16140F', textDecoration: 'none' }}
                      >
                        Abrir
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 L15 12 L9 18"/></svg>
                      </Link>
                    </div>
                    {/* Row actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <RoutesActions routeId={route.id} routeLabel={route.van_label} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function RoutesTabFilter({ tab, counts }: { tab: string; counts: Record<string, number> }) {
  const tabs = [
    { value: 'all', label: 'Todas', count: counts.all },
    { value: 'Active', label: 'Ativas', count: counts.Active },
    { value: 'Pending', label: 'Pendentes', count: counts.Pending },
    { value: 'Inactive', label: 'Inativas', count: counts.Inactive },
  ]
  return (
    <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 999, padding: 3, gap: 2 }}>
      {tabs.map(t => {
        const active = tab === t.value
        return (
          <Link
            key={t.value}
            href={t.value === 'all' ? '/routes' : `/routes?tab=${t.value}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999,
              background: active ? '#16140F' : 'transparent',
              color: active ? '#fff' : 'rgba(22,20,15,0.58)',
              fontSize: 12.5, fontWeight: active ? 600 : 500, textDecoration: 'none',
            }}
          >
            {t.label}
            <span style={{
              fontSize: 10.5, padding: '1px 6px', borderRadius: 999,
              background: active ? 'rgba(255,255,255,0.16)' : '#F4F2EC',
              color: active ? 'rgba(255,255,255,0.92)' : 'rgba(22,20,15,0.58)',
              fontWeight: 600,
            }}>
              {t.count}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
