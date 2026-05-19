export function PageSkeleton() {
  return (
    <div style={{ padding: '28px 32px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="animate-pulse" style={{ width: 160, height: 22, borderRadius: 6, background: '#E8E6E0' }} />
            <div className="animate-pulse" style={{ width: 260, height: 13, borderRadius: 5, background: '#EDEAE4' }} />
          </div>
          <div className="animate-pulse" style={{ width: 110, height: 34, borderRadius: 10, background: '#E8E6E0' }} />
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid rgba(20,16,10,0.08)', borderRadius: 16, overflow: 'hidden' }}>

          {/* Column headers */}
          <div style={{ display: 'flex', gap: 16, padding: '12px 20px', borderBottom: '1px solid rgba(20,16,10,0.08)', background: '#F4F2EC' }}>
            {[100, 140, 90, 70, 80].map((w, i) => (
              <div key={i} className="animate-pulse" style={{ width: w, height: 10, borderRadius: 4, background: '#DEDAD3' }} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: '1px solid rgba(20,16,10,0.06)',
              }}
            >
              <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: 999, background: '#EDEAE4', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div className="animate-pulse" style={{ width: `${38 + (i * 19) % 38}%`, height: 12, borderRadius: 4, background: '#EDEAE4' }} />
                <div className="animate-pulse" style={{ width: `${22 + (i * 13) % 26}%`, height: 10, borderRadius: 4, background: '#F0EDE8' }} />
              </div>
              <div className="animate-pulse" style={{ width: 64, height: 22, borderRadius: 6, background: '#EDEAE4', flexShrink: 0 }} />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
