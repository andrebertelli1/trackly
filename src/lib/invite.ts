import { useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { useAuth } from './auth';

export type InviteRoute = {
  id: string;
  direction: 'pickup' | 'dropoff';
  pickup_start: string | null;
  arrival_time: string | null;
};

export type ValidatedInvite = {
  school: { id: string; name: string; city: string | null } | null;
  van: {
    id: string;
    label: string;
    color: string | null;
  } | null;
  routes: InviteRoute[];
};

export class InviteError extends Error {
  /** Friendly pt-BR message safe to show to the user. */
  friendly: string;
  constructor(message: string, friendly: string) {
    super(message);
    this.friendly = friendly;
  }
}

function mapInviteError(err: { code?: string; message?: string }): InviteError {
  // SQLSTATEs raised by validate_invite_code / link_kid_to_van:
  //   P0001 invalid · P0002 expired · P0003 maxed out · P0004 kid not yours · 28000 not logged in.
  const code = err.code;
  if (code === 'P0001') return new InviteError(err.message ?? '', 'Código inválido.');
  if (code === 'P0002') return new InviteError(err.message ?? '', 'Código expirado.');
  if (code === 'P0003')
    return new InviteError(err.message ?? '', 'Código já foi resgatado o máximo de vezes.');
  if (code === 'P0004')
    return new InviteError(err.message ?? '', 'Esta criança não pertence à sua conta.');
  if (code === '28000')
    return new InviteError(err.message ?? '', 'Faça login antes de continuar.');
  return new InviteError(err.message ?? 'erro', err.message ?? 'Não foi possível validar o código.');
}

/**
 * Anonymous validation: returns school + van + every route the van runs,
 * without consuming a redemption.
 */
export function useValidateInviteCode() {
  return useMutation({
    mutationFn: async (code: string): Promise<ValidatedInvite> => {
      const { data, error } = await supabase.rpc('validate_invite_code', {
        p_code: code.toUpperCase().trim(),
      });
      if (error) throw mapInviteError(error);
      return data as ValidatedInvite;
    },
  });
}

export type LinkInput = {
  code: string;
  kid_id: string;
};

/**
 * Links one of the parent's kids to ALL of the van's routes (the code points
 * to a van; the linkage covers every direction the van runs). Consumes one
 * redemption the first time this parent uses the code.
 */
export function useLinkKidToVan() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: LinkInput) => {
      const { data, error } = await supabase.rpc('link_kid_to_van', {
        p_code: input.code.toUpperCase().trim(),
        p_kid_id: input.kid_id,
      });
      if (error) throw mapInviteError(error);
      return data as { kid_id: string; van_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-kids', user?.id] });
    },
  });
}
