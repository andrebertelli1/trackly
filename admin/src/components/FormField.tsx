const inputClass =
  'w-full px-3.5 py-2.5 rounded-[13px] text-[14px] text-ink outline-none transition-all bg-surface placeholder:text-ink-faint focus:ring-2 focus:ring-brand/30 focus:border-brand/40'

const borderStyle = { border: '1px solid rgba(20,16,10,0.14)' }

export function FormField({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold uppercase tracking-[0.6px] text-ink-muted">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        style={borderStyle}
        className={inputClass}
      />
    </div>
  )
}

export function SelectField({
  label,
  name,
  required,
  defaultValue,
  children,
}: {
  label: string
  name: string
  required?: boolean
  defaultValue?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[11px] font-bold uppercase tracking-[0.6px] text-ink-muted">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        style={borderStyle}
        className={inputClass}
      >
        {children}
      </select>
    </div>
  )
}
