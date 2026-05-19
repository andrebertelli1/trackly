'use client'

import { useState, useActionState } from 'react'
import { Modal, ModalActions } from '@/components/Modal'
import { FormField, SelectField } from '@/components/FormField'
import { Button, SubmitButton } from '@/components/Button'
import { generateInviteCode } from './actions'
import type { Kid } from '@/lib/supabase'

export function GenerateCodeDialog({ kids }: { kids: Kid[] }) {
  const [open, setOpen] = useState(false)

  const [error, dispatch] = useActionState(async (_prev: string | null, formData: FormData) => {
    try {
      await generateInviteCode(formData)
      setOpen(false)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Erro ao gerar código'
    }
  }, null)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 10, border: '1px solid transparent', background: '#3A5BD9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>
        Gerar código
      </button>
      <Modal title="Gerar código de convite" open={open} onClose={() => setOpen(false)}>
        <form action={dispatch} className="flex flex-col gap-4">
          <SelectField label="Aluno" name="kid_id" required>
            <option value="">Selecione um aluno</option>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>{k.full_name}</option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Validade (dias)"
              name="expires_in_days"
              type="number"
              defaultValue="14"
            />
            <FormField
              label="Máx. resgates"
              name="max_redemptions"
              type="number"
              defaultValue="2"
            />
          </div>
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <ModalActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton pendingLabel="Gerando…">Gerar código</SubmitButton>
          </ModalActions>
        </form>
      </Modal>
    </>
  )
}
