export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { mockRoutes, mockKids, mockInviteCodes } from '@/lib/mock'
import { StatusBadge } from '@/components/StatusBadge'
import { Avatar } from '@/components/Avatar'
import Link from 'next/link'
import type { Route, RouteStop, Kid } from '@/lib/supabase'

const periodLabel: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde' }

async function getRoute(id: string) {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*, schools(name), profiles(full_name, phone)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Route
  } catch {
    return mockRoutes.find(r => r.id === id) ?? mockRoutes[0]
  }
}

async function getStops(routeId: string): Promise<RouteStop[]> {
  try {
    const { data, error } = await supabase
      .from('route_stops')
      .select('*')
      .eq('route_id', routeId)
      .order('stop_order')
    if (error) throw error
    return data ?? []
  } catch {
    return []
  }
}

async function getStudents(routeId: string): Promise<Kid[]> {
  try {
    const { data, error } = await supabase
      .from('kid_route_assignments')
      .select('kids(*, parent_kid_links(profiles(full_name)))')
      .eq('route_id', routeId)
    if (error) throw error
    return (data ?? []).map((r: unknown) => (r as { kids: Kid }).kids).filter(Boolean)
  } catch {
    return mockKids.filter(k => k.kid_route_assignments?.some(a => a.routes?.van_label === mockRoutes.find(r => r.id === routeId)?.van_label))
  }
}

async function getCodes(routeId: string) {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('route_id', routeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  } catch {
    return mockInviteCodes.filter(c => c.route_id === routeId)
  }
}

const MOCK_STOPS = [
  { id: 'st1', order: 1, name: 'Av. Libertador & Tagle', eta: '06:42', kids: 1 },
  { id: 'st2', order: 2, name: 'Plaza Italia', eta: '06:48', kids: 2 },
  { id: 'st3', order: 3, name: 'Honduras & Borges', eta: '06:55', kids: 3 },
  { id: 'st4', order: 4, name: 'Av. Santa Fe & Pueyrredón', eta: '07:04', kids: 2 },
  { id: 'st5', order: 5, name: 'Callao & Corrientes', eta: '07:11', kids: 1 },
  { id: 'st6', order: 6, name: 'Av. Belgrano & Combate de los Pozos', eta: '07:19', kids: 3 },
  { id: 'st7', order: 7, name: 'Av. Independencia & Lima', eta: '07:24', kids: 2 },
]

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [route, dbStops, students, codes] = await Promise.all([
    getRoute(id),
    getStops(id),
    getStudents(id),
    getCodes(id),
  ])

  const r = route as unknown as Route & { status?: string }
  const color = r.van_color || '#3A5BD9'
  const driver = r.profiles
  const shift = periodLabel[r.period] ?? r.period
  const status = r.status ?? 'Active'
  const schoolName = r.schools?.name ?? '—'

  const stops = dbStops.length > 0
    ? dbStops.map(s => ({ id: s.id, order: s.stop_order, name: s.address, eta: s.scheduled_time ?? '—', kids: 0, isSchool: s.label === 'school' }))
    : [...MOCK_STOPS, { id: 'school', order: 8, name: schoolName, eta: r.arrival_time?.slice(0,5) ?? '—', kids: 0, isSchool: true }]

  const now = new Date()

  // Map SVG data
  const W = 800, H = 360
  const pts = stops.map((s, i) => ({
    ...s,
    x: 60 + (W - 120) * (i / Math.max(stops.length - 1, 1)),
    y: 90 + Math.sin(i * 1.1) * 70 + (i % 2 ? 30 : -10),
  }))
  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'rgba(22,20,15,0.58)', marginBottom: 6 }}>
              <Link href="/routes" style={{ color: 'rgba(22,20,15,0.58)', textDecoration: 'none' }}>Rotas</Link>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 L15 12 L9 18"/></svg>
              <span>{r.van_label}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
              {r.van_label} · {shift}
            </h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>{schoolName}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: '1px solid rgba(20,16,10,0.14)', background: '#fff', fontSize: 13, fontWeight: 600, color: '#16140F', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20 H8 L19 9 L15 5 L4 16 Z"/><path d="M13 7 L17 11"/></svg>
              Editar rota
            </button>
          </div>
        </header>

        {/* Map + Summary grid */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 14 }}>

          {/* Map hero */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 360, background: '#EFEAE0' }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="mapgrid" width="36" height="36" patternUnits="userSpaceOnUse">
                    <path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(20,16,10,0.06)" strokeWidth="1" />
                  </pattern>
                  <pattern id="mapgrid-lg" width="180" height="180" patternUnits="userSpaceOnUse">
                    <path d="M 180 0 L 0 0 0 180" fill="none" stroke="rgba(20,16,10,0.10)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width={W} height={H} fill="#EFEAE0" />
                <rect width={W} height={H} fill="url(#mapgrid)" />
                <rect width={W} height={H} fill="url(#mapgrid-lg)" />
                <path d="M 0 250 Q 250 220 500 260 T 800 240" stroke="rgba(58,91,217,0.10)" strokeWidth="22" fill="none" />
                <path d="M 0 100 L 800 130" stroke="rgba(20,16,10,0.05)" strokeWidth="14" fill="none" />
                <path d="M 220 0 L 240 360" stroke="rgba(20,16,10,0.05)" strokeWidth="14" fill="none" />
                <path d="M 580 0 L 560 360" stroke="rgba(20,16,10,0.05)" strokeWidth="14" fill="none" />
                <path d={pathD} stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d={pathD} stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                {pts.map(p => p.isSchool ? (
                  <g key={p.id}>
                    <rect x={p.x - 10} y={p.y - 10} width="20" height="20" rx="5" fill={color} />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">S</text>
                  </g>
                ) : (
                  <g key={p.id}>
                    <circle cx={p.x} cy={p.y} r="8" fill="#fff" stroke={color} strokeWidth="2.5" />
                    <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{p.order}</text>
                  </g>
                ))}
              </svg>
              <div style={{
                position: 'absolute', left: 16, bottom: 16,
                display: 'inline-flex', alignItems: 'center', gap: 14,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(20,16,10,0.08)', borderRadius: 999,
                padding: '6px 12px', fontSize: 12, fontWeight: 500,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: color }} />
                  {r.van_label}
                </span>
                <span style={{ color: 'rgba(22,20,15,0.58)' }}>{stops.filter(s => !s.isSchool).length} paradas</span>
              </div>
            </div>
          </div>

          {/* Route summary */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Hoje</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Resumo da rota</div>
              </div>
              <StatusBadge status={status} />
            </div>

            <dl style={{ margin: 0, padding: '6px 18px 4px', display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Horário', value: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.pickup_start?.slice(0,5) ?? '—'} → {r.arrival_time?.slice(0,5) ?? '—'}</span> },
                { label: 'Motorista', value: driver?.full_name ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={driver.full_name} color={color} size={22} />
                    <span>{driver.full_name}</span>
                  </div>
                ) : <span style={{ color: 'rgba(22,20,15,0.38)' }}>Não atribuído</span> },
                { label: 'Paradas', value: `${stops.filter(s => !s.isSchool).length}` },
                { label: 'Alunos', value: `${students.length} matriculados` },
                { label: 'Escola', value: schoolName },
              ].map(row => (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, padding: '9px 0', borderBottom: '1px dashed rgba(20,16,10,0.08)', alignItems: 'center' }}>
                  <dt style={{ fontSize: 11.5, color: 'rgba(22,20,15,0.58)', fontWeight: 500, margin: 0 }}>{row.label}</dt>
                  <dd style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* Active codes */}
            <div style={{ padding: '4px 18px 18px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)', marginBottom: 8, marginTop: 12 }}>
                Códigos de convite ativos
              </div>
              {codes.length === 0 ? (
                <span style={{ fontSize: 12, color: 'rgba(22,20,15,0.38)' }}>Nenhum código ativo.</span>
              ) : codes.slice(0, 3).map((c: unknown) => {
                const code = c as { code: string; redemption_count?: number; max_redemptions?: number; expires_at: string; status?: string }
                const expired = new Date(code.expires_at) <= now
                const uses = code.redemption_count ?? 0
                const max = code.max_redemptions ?? 2
                const s = code.status ?? (expired ? 'Expired' : uses >= max ? 'Exhausted' : 'Active')
                return (
                  <div key={code.code} style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: 8, alignItems: 'center', padding: '7px 0' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 700, background: '#F4F2EC', border: '1px solid rgba(20,16,10,0.08)', padding: '4px 9px', borderRadius: 6 }}>
                      {code.code}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(22,20,15,0.58)' }}>{uses}/{max}</span>
                    <StatusBadge status={s} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Stops + Students */}
        <section style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 14 }}>

          {/* Ordered stops */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Itinerário</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Paradas em ordem</div>
              </div>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: '12px 18px 16px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {stops.map((s, i) => (
                <li key={s.id} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '28px 1fr auto auto', alignItems: 'center', gap: 14, padding: '12px 0' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: s.isSchool ? color : 'transparent', border: s.isSchool ? 'none' : `2px solid ${color}`, color: s.isSchool ? '#fff' : color, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                    {s.isSchool ? 'S' : s.order}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: s.isSchool ? 700 : 500 }}>{s.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)' }}>{s.eta}</span>
                  <span style={{ fontSize: 11.5, color: 'rgba(22,20,15,0.58)', minWidth: 80, textAlign: 'right' }}>
                    {s.isSchool ? <span style={{ color: 'rgba(22,20,15,0.38)' }}>chegada</span> : `${s.kids} embarque${s.kids === 1 ? '' : 's'}`}
                  </span>
                  {i < stops.length - 1 && (
                    <span style={{ position: 'absolute', left: 12, top: 36, width: 2, height: 24, background: 'rgba(20,16,10,0.14)' }} />
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Assigned students */}
          <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: '1px solid rgba(20,16,10,0.08)' }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(22,20,15,0.58)' }}>Alunos matriculados</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{students.length} nesta rota</div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px 12px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {students.length === 0 ? (
                <li style={{ color: 'rgba(22,20,15,0.38)', fontSize: 13, padding: 12 }}>Nenhum aluno matriculado ainda.</li>
              ) : students.map((s) => (
                <li key={s.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', alignItems: 'center', gap: 11, padding: '9px 8px', borderRadius: 8 }}>
                  <Avatar name={s.full_name} color={color} size={28} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{s.full_name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(22,20,15,0.58)' }}>
                      {s.grade != null ? `${s.grade}º ano` : ''}
                      {s.parent_name ? ` · ${s.parent_name}` : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </div>
    </div>
  )
}
