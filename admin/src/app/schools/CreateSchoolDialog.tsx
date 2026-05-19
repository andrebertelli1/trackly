'use client'

import { useState, useActionState } from 'react'
import { Modal, ModalActions } from '@/components/Modal'
import { FormField } from '@/components/FormField'
import { Button, SubmitButton } from '@/components/Button'
import { createSchool } from './actions'

export function CreateSchoolDialog() {
  const [open, setOpen] = useState(false)
  const [error, dispatch] = useActionState(async (_prev: string | null, formData: FormData) => {
    try {
      await createSchool(formData)
      setOpen(false)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Erro ao criar escola'
    }
  }, null)

  return (
    <>
      <Button onClick={() => setOpen(true)} icon={
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5 V19"/><path d="M5 12 H19"/></svg>
      }>Nova escola</Button>
      <Modal title="Criar escola" description="Adicione uma nova escola ao diretório operacional." open={open} onClose={() => setOpen(false)}>
        <form action={dispatch} className="flex flex-col gap-4">
          <FormField label="Nome" name="name" required placeholder="Colegio San Martín" />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cidade" name="city" required placeholder="Buenos Aires" />
            <FormField label="Estado / Província" name="state" placeholder="CABA" />
          </div>
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <ModalActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton pendingLabel="Criando…">Criar escola</SubmitButton>
          </ModalActions>
        </form>
      </Modal>
    </>
  )
}
