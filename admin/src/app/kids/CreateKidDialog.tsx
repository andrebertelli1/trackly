'use client'

import { useState, useActionState } from 'react'
import { Modal, ModalActions } from '@/components/Modal'
import { FormField, SelectField } from '@/components/FormField'
import { Button, SubmitButton } from '@/components/Button'
import { createKid } from './actions'
import type { Route } from '@/lib/supabase'

export function CreateKidDialog({ routes }: { routes: Route[] }) {
  const [open, setOpen] = useState(false)

  const [error, dispatch] = useActionState(async (_prev: string | null, formData: FormData) => {
    try {
      await createKid(formData)
      setOpen(false)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Erro ao criar aluno'
    }
  }, null)

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Novo Aluno</Button>
      <Modal title="Novo Aluno" open={open} onClose={() => setOpen(false)}>
        <form action={dispatch} className="flex flex-col gap-4">
          <FormField label="Nome completo" name="full_name" required placeholder="Ex: Maya Park" />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Apelido" name="short_name" placeholder="Ex: Maya" />
            <FormField label="Ano escolar" name="grade" type="number" placeholder="Ex: 3" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Cor do avatar</label>
            <input
              name="color"
              type="color"
              defaultValue="#5B7A9F"
              className="h-10 w-full rounded-lg border border-slate-300 cursor-pointer"
            />
          </div>
          <SelectField label="Vincular a uma rota" name="route_id">
            <option value="">Sem rota por enquanto</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.van_label} — {r.schools?.name ?? 'sem escola'} ({r.period === 'morning' ? 'Manhã' : 'Tarde'})
              </option>
            ))}
          </SelectField>
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <ModalActions>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton pendingLabel="Criando…">Criar Aluno</SubmitButton>
          </ModalActions>
        </form>
      </Modal>
    </>
  )
}
