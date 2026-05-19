'use client'

import { useTransition } from 'react'
import { RowActions } from '@/components/RowActions'
import { useToast } from '@/components/Toast'
import { deleteKid } from './actions'

export function KidsActions({ kidId, kidName }: { kidId: string; kidName: string }) {
  const [, startTransition] = useTransition()
  const toast = useToast()

  return (
    <RowActions
      onDelete={() => {
        startTransition(async () => {
          try {
            await deleteKid(kidId)
            toast.success('Aluno removido', kidName)
          } catch {
            toast.error('Falha ao remover aluno', kidName)
          }
        })
      }}
    />
  )
}
