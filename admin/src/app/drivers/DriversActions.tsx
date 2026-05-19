'use client'

import { useTransition } from 'react'
import { RowActions } from '@/components/RowActions'
import { useToast } from '@/components/Toast'
import { demoteDriver } from './actions'

export function DriversActions({ driverId, driverName }: { driverId: string; driverName: string }) {
  const [, startTransition] = useTransition()
  const toast = useToast()

  return (
    <RowActions
      onDelete={() => {
        startTransition(async () => {
          try {
            await demoteDriver(driverId)
            toast.success('Motorista rebaixado', driverName)
          } catch {
            toast.error('Falha ao rebaixar motorista', driverName)
          }
        })
      }}
    />
  )
}
