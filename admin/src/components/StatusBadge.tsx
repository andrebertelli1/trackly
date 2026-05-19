type Status = 'Active' | 'Inactive' | 'Pending' | 'Expired' | 'Exhausted'

const config: Record<Status, { bg: string; color: string; label: string }> = {
  Active:    { bg: 'rgba(31,138,91,0.12)',   color: '#1F8A5B',              label: 'Ativo' },
  Inactive:  { bg: 'rgba(22,20,15,0.07)',    color: 'rgba(22,20,15,0.58)', label: 'Inativo' },
  Pending:   { bg: 'rgba(245,165,36,0.14)',  color: '#B5751A',              label: 'Pendente' },
  Expired:   { bg: 'rgba(208,79,60,0.12)',   color: '#D04F3C',              label: 'Expirado' },
  Exhausted: { bg: 'rgba(22,20,15,0.07)',    color: 'rgba(22,20,15,0.58)', label: 'Esgotado' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = config[status as Status] ?? { bg: 'rgba(22,20,15,0.07)', color: 'rgba(22,20,15,0.58)', label: status }
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color }}
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-[6px] text-[11px] font-semibold whitespace-nowrap"
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0" />
      {cfg.label}
    </span>
  )
}
