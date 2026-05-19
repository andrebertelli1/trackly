'use client'

import { useState, useActionState } from 'react'
import { Modal, ModalActions } from '@/components/Modal'
import { FormField, SelectField } from '@/components/FormField'
import { Button, SubmitButton } from '@/components/Button'
import { createRoute } from './actions'
import type { School, Profile } from '@/lib/supabase'

type Stop = { address: string; scheduled_time: string; label: string }

function StopRow({
  index,
  stop,
  onChange,
  onRemove,
}: {
  index: number
  stop: Stop
  onChange: (field: keyof Stop, value: string) => void
  onRemove: () => void
}) {
  const inputStyle = {
    border: '1px solid rgba(20,16,10,0.14)',
    background: '#fff',
    color: '#16140F',
    fontSize: 13,
    borderRadius: 10,
    padding: '8px 12px',
    outline: 'none',
  }
  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <input
          type="text"
          placeholder={`Parada ${index + 1} — endereço`}
          value={stop.address}
          onChange={(e) => onChange('address', e.target.value)}
          style={inputStyle}
          className="w-full"
        />
      </div>
      <input
        type="time"
        value={stop.scheduled_time}
        onChange={(e) => onChange('scheduled_time', e.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Rótulo"
        value={stop.label}
        onChange={(e) => onChange('label', e.target.value)}
        style={{ ...inputStyle, width: 88 }}
      />
      <button
        type="button"
        onClick={onRemove}
        style={{ color: 'rgba(22,20,15,0.35)', fontSize: 18, lineHeight: 1 }}
        className="hover:text-danger transition-colors"
      >
        ×
      </button>
    </div>
  )
}

export function CreateRouteDialog({
  schools,
  drivers,
}: {
  schools: School[]
  drivers: Profile[]
}) {
  const [open, setOpen] = useState(false)
  const [stops, setStops] = useState<Stop[]>([{ address: '', scheduled_time: '', label: '' }])

  const [error, dispatch] = useActionState(async (_prev: string | null, formData: FormData) => {
    try {
      formData.set('stops', JSON.stringify(stops))
      await createRoute(formData)
      setOpen(false)
      setStops([{ address: '', scheduled_time: '', label: '' }])
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Erro ao criar rota'
    }
  }, null)

  const updateStop = (i: number, field: keyof Stop, value: string) => {
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nova Rota</Button>
      <Modal title="Nova Rota" open={open} onClose={() => setOpen(false)}>
        <form action={dispatch} className="flex flex-col gap-4">
          <SelectField label="Escola" name="school_id" required>
            <option value="">Selecione uma escola</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SelectField>

          <FormField label="Identificação da Van" name="van_label" required placeholder="Ex: VK-32" />

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Período" name="period" required>
              <option value="morning">Manhã</option>
              <option value="afternoon">Tarde</option>
            </SelectField>
            <FormField label="Cor da Van" name="van_color" type="color" defaultValue="#5B7A9F" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Início das coletas" name="pickup_start" type="time" />
            <FormField label="Chegada na escola" name="arrival_time" type="time" />
          </div>

          <SelectField label="Motorista" name="driver_id">
            <option value="">Sem motorista</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name ?? d.id}</option>
            ))}
          </SelectField>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.6px] text-ink-muted">Paradas</span>
            {stops.map((s, i) => (
              <StopRow
                key={i}
                index={i}
                stop={s}
                onChange={(field, value) => updateStop(i, field, value)}
                onRemove={() => setStops((prev) => prev.filter((_, idx) => idx !== i))}
              />
            ))}
            <button
              type="button"
              onClick={() => setStops((prev) => [...prev, { address: '', scheduled_time: '', label: '' }])}
              className="text-[13px] font-semibold text-left transition-opacity hover:opacity-60"
              style={{ color: '#3A5BD9' }}
            >
              + Adicionar parada
            </button>
          </div>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <ModalActions>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <SubmitButton pendingLabel="Criando…">Criar Rota</SubmitButton>
          </ModalActions>
        </form>
      </Modal>
    </>
  )
}
