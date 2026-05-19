export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-1 px-5">
      <div
        style={{ width: 56, height: 56, borderRadius: 16, background: '#F4F2EC', color: 'rgba(22,20,15,0.38)', marginBottom: 14 }}
        className="flex items-center justify-center"
      >
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
            <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          </svg>
        )}
      </div>
      <div className="text-[16px] font-bold text-ink">{title}</div>
      {description && (
        <div className="text-[13px] text-ink-muted max-w-[380px] leading-relaxed mt-1">{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
