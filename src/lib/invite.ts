import { useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { useAuth } from './auth';

export type ValidatedInvite = {
  school: { id: string; name: string; city: string | null } | null;
  route: {
    id: string;
    van_label: string;
    van_color: string | null;
    period: 'morning' | 'afternoon';
    pickup_start: string | null;
    arrival_time: string | null;
    school_id: string;
    driver_id: string | null;
  } | null;
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
  // SQLSTATEs raised by validate_invite_code / link_kid_to_route:
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
 * Anonymous validation: confirms the code is good and returns the route +
 * school + stops the parent will choose from. Doesn't consume a redemption.
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
 * Authenticated parent links one of their kids to the route the code identifies.
 * The pickup address comes from the kid's own record (pickup_address /
 * dropoff_address) based on the route's period — no per-link stop selection.
 * Consumes one redemption the first time this parent uses the code.
 */
export function useLinkKidToRoute() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: LinkInput) => {
      const { data, error } = await supabase.rpc('link_kid_to_route', {
        p_code: input.code.toUpperCase().trim(),
        p_kid_id: input.kid_id,
      });
      if (error) throw mapInviteError(error);
      return data as { kid_id: string; route_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-kids', user?.id] });
    },
  });
}
