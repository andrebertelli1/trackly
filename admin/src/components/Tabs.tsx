'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Tab { value: string; label: string; count?: number }

export function Tabs({ tabs, paramName = 'tab' }: { tabs: Tab[]; paramName?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get(paramName) ?? tabs[0]?.value ?? 'all'

  const navigate = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(paramName, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div
      style={{
        display: 'inline-flex', background: '#fff',
        border: '1px solid rgba(20,16,10,0.08)',
        borderRadius: 999, padding: 3, gap: 2,
      }}
    >
      {tabs.map(t => {
        const active = current === t.value
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => navigate(t.value)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999, border: 0,
              background: active ? '#16140F' : 'transparent',
              color: active ? '#fff' : 'rgba(22,20,15,0.58)',
              fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: 'pointer',
              transition: 'background 120ms',
            }}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span style={{
                fontSize: 10.5, padding: '1px 6px', borderRadius: 999,
                background: active ? 'rgba(255,255,255,0.16)' : '#F4F2EC',
                color: active ? 'rgba(255,255,255,0.92)' : 'rgba(22,20,15,0.58)',
                fontWeight: 600,
              }}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
