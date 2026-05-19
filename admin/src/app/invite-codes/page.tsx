export const revalidate = 30

import { getInviteCodesWithRedemptions, getKidsBasic } from '@/lib/queries'
import { StatusBadge } from '@/components/StatusBadge'
import { InviteCodesTable } from './InviteCodesTable'
import { GenerateCodeDialog } from './GenerateCodeDialog'

export default async function InviteCodesPage() {
  const [rows, kids] = await Promise.all([getInviteCodesWithRedemptions(), getKidsBasic()])

  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Códigos de convite</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(22,20,15,0.58)', fontSize: 13 }}>
              Gere, distribua e audite códigos de convite por rota.
            </p>
          </div>
          <GenerateCodeDialog kids={kids} />
        </header>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <InviteCodesTable rows={rows} />
        </div>

      </div>
    </div>
  )
}

export { StatusBadge }
