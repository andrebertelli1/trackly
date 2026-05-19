'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; icon: React.ReactNode }

function IconOverview() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function IconSchool() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 L12 5 L21 10 L12 15 Z" />
      <path d="M7 12 V17 C7 18 9.5 19.5 12 19.5 C14.5 19.5 17 18 17 17 V12" />
      <path d="M21 10 V14" />
    </svg>
  )
}
function IconRoute() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M6 7 V11 C6 13 8 14 10 14 H14 C16 14 18 15 18 17" />
    </svg>
  )
}
function IconStudents() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 L12 7 L21 11 L12 15 Z" />
      <path d="M8 13 V17 C8 18 10 19 12 19 C14 19 16 18 16 17 V13" />
    </svg>
  )
}
function IconDriver() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20 C4.5 16 8 14 12 14 C16 14 19.5 16 19.5 20" />
    </svg>
  )
}
function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="3.5" />
      <path d="M11 13 L20 4" />
      <path d="M17 7 L19.5 9.5" />
      <path d="M14.5 9.5 L17 12" />
    </svg>
  )
}
function IconLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M6 12 L10 12 L12 8 L14 16 L16 12 L18 12" />
    </svg>
  )
}

const links: NavItem[] = [
  { href: '/',            label: 'Visão Geral',   icon: <IconOverview /> },
  { href: '/schools',     label: 'Escolas',        icon: <IconSchool /> },
  { href: '/routes',      label: 'Rotas',          icon: <IconRoute /> },
  { href: '/kids',        label: 'Alunos',         icon: <IconStudents /> },
  { href: '/drivers',     label: 'Motoristas',     icon: <IconDriver /> },
  { href: '/invite-codes',label: 'Convites',       icon: <IconKey /> },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-56 min-h-screen flex flex-col sticky top-0 h-screen"
      style={{ background: '#16140F', padding: '18px 14px 14px', gap: 6 }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 18px' }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8, background: '#3A5BD9', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconLogo />
        </span>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', color: '#fff' }}>
          Trackly
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.42)', padding: '2px 6px', borderRadius: 4,
          background: 'rgba(255,255,255,0.06)',
        }}>
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {links.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 10px', borderRadius: 999, fontSize: 13, fontWeight: active ? 600 : 500,
                background: active ? '#3A5BD9' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.78)',
                transition: 'opacity 120ms',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.78)' }}
            >
              {icon}
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer org */}
      <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999, background: '#3A5BD9',
            color: '#fff', fontSize: 11, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>Trackly Ops</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>admin@trackly.app</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
