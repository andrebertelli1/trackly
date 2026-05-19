export const revalidate = 30

import { getSchools } from '@/lib/queries'
import { StatusBadge } from '@/components/StatusBadge'
import { CreateSchoolDialog } from './CreateSchoolDialog'
import { SchoolsTable } from './SchoolsTable'

export default async function SchoolsPage() {
  const schools = await getSchools()

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0, color: '#16140F' }}>Escolas</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>
              Gerencie escolas, rotas vinculadas e matrículas.
            </p>
          </div>
          <CreateSchoolDialog />
        </header>

        {/* Table card */}
        <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <SchoolsTable schools={schools} />
        </div>

      </div>
    </div>
  )
}

export { StatusBadge }
