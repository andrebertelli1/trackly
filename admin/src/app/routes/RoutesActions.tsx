'use client'

import { useTransition } from 'react'
import { RowActions } from '@/components/RowActions'
import { useToast } from '@/components/Toast'
import { deleteRoute } from './actions'

export function RoutesActions({ routeId, routeLabel }: { routeId: string; routeLabel: string }) {
  const [, startTransition] = useTransition()
  const toast = useToast()

  return (
    <RowActions
      onDelete={() => {
        startTransition(async () => {
          try {
            await deleteRoute(routeId)
            toast.success('Rota removida', routeLabel)
          } catch {
            toast.error('Falha ao remover rota', routeLabel)
          }
        })
      }}
    />
  )
}
