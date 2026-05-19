function hashHue(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  const hues = [10, 32, 152, 212, 264, 320, 188, 96]
  return hues[Math.abs(h) % hues.length]
}

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function Avatar({ name, color, size = 28 }: { name: string; color?: string; size?: number }) {
  const initials = initialsOf(name || '?')
  const bg = color || `oklch(0.62 0.12 ${hashHue(name || '?')})`
  const fontSize = size <= 28 ? 11 : size <= 36 ? 13 : 16

  return (
    <div
      style={{ width: size, height: size, background: bg, fontSize, borderRadius: 999, flexShrink: 0 }}
      className="inline-flex items-center justify-center text-white font-bold select-none"
    >
      {initials}
    </div>
  )
}
