export const revalidate = 30

import { getKidsWithAssignments, getRoutesBasic } from '@/lib/queries'
import { Avatar } from '@/components/Avatar'
import { KidsActions } from './KidsActions'
import { CreateKidDialog } from './CreateKidDialog'

const COL = '1.4fr 80px 1.3fr 1.1fr 1.2fr 108px 56px'

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

export default async function KidsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [kids, routes] = await Promise.all([getKidsWithAssignments(), getRoutesBasic()])
  const params = await searchParams
  const gradeFilter = params.grade ?? 'all'

  const allGrades = Array.from(new Set(kids.map(k => k.grade).filter((g): g is number => g != null))).sort((a, b) => a - b)

  const filtered = gradeFilter === 'all' ? kids : kids.filter(k => String(k.grade) === gradeFilter)

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Alunos</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>
              {kids.length} students across {new Set(kids.map(k => k.kid_route_assignments?.[0]?.routes?.schools?.name)).size} schools
            </p>
          </div>
          <CreateKidDialog routes={routes} />
        </header>

        {/* Grade filter tabs */}
        <div>
          <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 999, padding: 3, gap: 2 }}>
            {[{ value: 'all', label: 'Todas as séries', count: kids.length }, ...allGrades.map(g => ({ value: String(g), label: `${g}º ano`, count: kids.filter(k => k.grade === g).length }))].map(t => {
              const active = gradeFilter === t.value
              return (
                <a
                  key={t.value}
                  href={t.value === 'all' ? '/kids' : `/kids?grade=${t.value}`}
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
                </a>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 860 }}>
              <div style={{ display: 'grid', gridTemplateColumns: COL, background: '#F4F2EC', borderBottom: '1px solid rgba(20,16,10,0.08)', padding: '0 16px' }}>
                <Th>Aluno</Th>
                <Th>Série</Th>
                <Th>Responsável</Th>
                <Th>Rota</Th>
                <Th>Escola</Th>
                <Th>Desde</Th>
                <Th align="right"> </Th>
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(22,20,15,0.38)', fontSize: 13 }}>Nenhum aluno encontrado.</div>
              ) : filtered.map((k, i) => { // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const assignment = k.kid_route_assignments?.[0]
                const routeVan = assignment?.routes?.van_label
                const routeColor = (assignment?.routes as unknown as { van_color?: string })?.van_color ?? k.color ?? '#3A5BD9'
                const schoolName = assignment?.routes?.schools?.name
                const since = k.created_at ? new Date(k.created_at).toISOString().slice(0, 10) : '—'
                const parentName = k.parent_name ?? k.parent_kid_links?.[0]?.profiles?.full_name ?? '—'
                const parentPhone = k.parent_phone ?? '—'

                return (
                  <div
                    key={k.id}
                    className="hover:bg-surface-alt"
                    style={{
                      display: 'grid', gridTemplateColumns: COL,
                      alignItems: 'center', padding: '10px 16px',
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(20,16,10,0.08)' : 'none',
                      minHeight: 44, transition: 'background 100ms',
                    }}
                  >
                    {/* Student */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
                      <Avatar name={k.full_name} color={routeColor} size={28} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{k.full_name}</span>
                    </div>
                    {/* Grade */}
                    <div style={{ fontSize: 13, color: 'rgba(22,20,15,0.58)', paddingRight: 10 }}>
                      {k.grade != null ? `${k.grade}°` : '—'}
                    </div>
                    {/* Parent */}
                    <div style={{ paddingRight: 10 }}>
                      <div style={{ fontSize: 13 }}>{parentName}</div>
                      <div style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'rgba(22,20,15,0.58)', marginTop: 1 }}>{parentPhone}</div>
                    </div>
                    {/* Route */}
                    <div style={{ paddingRight: 10 }}>
                      {routeVan ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: routeColor, flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{routeVan}</span>
                        </div>
                      ) : <span style={{ color: 'rgba(22,20,15,0.38)' }}>—</span>}
                    </div>
                    {/* School */}
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 10 }}>
                      {schoolName ?? '—'}
                    </div>
                    {/* Since */}
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(22,20,15,0.58)' }}>{since}</div>
                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <KidsActions kidId={k.id} kidName={k.full_name} />
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
