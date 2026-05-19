'use client'

import { useEffect, useRef } from 'react'

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string
  description?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) ref.current?.showModal()
    else ref.current?.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-[20px] bg-surface shadow-2xl backdrop:bg-ink/30 open:flex open:flex-col"
      style={{ border: '1px solid rgba(20,16,10,0.09)', padding: 0 }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(20,16,10,0.07)' }}>
        <h2 className="text-[17px] font-bold tracking-[-0.4px] text-ink">{title}</h2>
        {description && <p className="text-[12px] text-ink-muted mt-0.5">{description}</p>}
      </div>

      {/* Scrollable body containing form + actions */}
      <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
        {children}
      </div>
    </dialog>
  )
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex justify-end gap-2 mt-4 pt-4 -mx-6 px-6 -mb-5 pb-5 sticky bottom-0 bg-surface"
      style={{ borderTop: '1px solid rgba(20,16,10,0.07)', marginBottom: '-1.25rem' }}
    >
      {children}
    </div>
  )
}
