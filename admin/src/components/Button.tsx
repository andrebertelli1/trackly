'use client'

import { useFormStatus } from 'react-dom'

type Variant = 'primary' | 'ghost' | 'quiet' | 'danger'
type Size = 'sm' | 'md'

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: '#3A5BD9', color: '#fff', border: '1px solid transparent' },
  ghost:   { background: '#fff', color: '#16140F', border: '1px solid rgba(20,16,10,0.14)' },
  quiet:   { background: 'transparent', color: 'rgba(22,20,15,0.58)', border: '1px solid transparent' },
  danger:  { background: '#D04F3C', color: '#fff', border: '1px solid transparent' },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon,
  iconRight,
  onClick,
  disabled,
  className = '',
}: {
  children?: React.ReactNode
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  const pad = size === 'sm' ? '6px 10px' : '8px 13px'
  const fontSize = size === 'sm' ? 12 : 13

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...variantStyles[variant], padding: pad, fontSize, gap: size === 'sm' ? 5 : 6 }}
      className={`inline-flex items-center rounded-[10px] font-semibold leading-none whitespace-nowrap transition-all disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      onMouseEnter={e => {
        if (disabled) return
        if (variant === 'primary') e.currentTarget.style.background = '#2C49B8'
        if (variant === 'ghost') e.currentTarget.style.background = '#F4F2EC'
        if (variant === 'quiet') { e.currentTarget.style.background = '#F4F2EC'; e.currentTarget.style.color = '#16140F' }
      }}
      onMouseLeave={e => {
        if (disabled) return
        const s = variantStyles[variant]
        e.currentTarget.style.background = s.background as string
        e.currentTarget.style.color = s.color as string
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  )
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = 'primary',
}: {
  children: React.ReactNode
  pendingLabel: string
  variant?: Variant
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
