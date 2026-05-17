import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { queryClient } from './queryClient';

WebBrowser.maybeCompleteAuthSession();

export type AuthField = 'email' | 'password' | 'name' | null;
export class AuthError extends Error {
  field: AuthField;
  constructor(message: string, field: AuthField = null) {
    super(message);
    this.field = field;
  }
}

export type SignUpResult = { needsEmailConfirmation: boolean };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True while the user is in a password-recovery flow (opened the email link). */
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; fullName: string; phone?: string }) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearRecoveryMode: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Map Supabase auth error messages to pt-BR + an associated field, so screens
// can show the message next to the right input instead of in a generic alert.
function mapAuthError(message: string): AuthError {
  const m = message.toLowerCase();
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return new AuthError('Este e-mail já está cadastrado.', 'email');
  }
  if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
    return new AuthError('E-mail ou senha incorretos.', 'password');
  }
  if (m.includes('email not confirmed')) {
    return new AuthError('Confirme seu e-mail para entrar.', 'email');
  }
  if (m.includes('invalid email') || m.includes('email address') || m.includes('unable to validate email')) {
    return new AuthError('E-mail inválido.', 'email');
  }
  if (m.includes('weak password') || m.includes('password should')) {
    return new AuthError('Senha muito fraca. Use ao menos 8 caracteres com letras e números.', 'password');
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return new AuthError('Muitas tentativas. Tente novamente em alguns minutos.');
  }
  if (m.includes('network') || m.includes('fetch')) {
    return new AuthError('Sem conexão com o servidor. Verifique sua internet.');
  }
  return new AuthError(message);
}

// Parse access/refresh tokens out of a Supabase deep-link URL fragment.
// Returns the token pair plus the URL's `type` flag (e.g. "recovery", "magiclink").
function parseSupabaseAuthUrl(url: string) {
  const fragment = url.split('#')[1] ?? '';
  if (!fragment) return null;
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, type: params.get('type') };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    });

    // Keep token fresh while the app is foregrounded.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    supabase.auth.startAutoRefresh();

    // Handle the recovery deep link (trackly://auth/reset-password#access_token=…).
    // `detectSessionInUrl: false` is set on the client (it's a web-only flag),
    // so we parse the URL ourselves and call setSession.
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const tokens = parseSupabaseAuthUrl(url);
      if (!tokens) return;
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
      if (error) return;
      if (tokens.type === 'recovery') setRecoveryMode(true);
    };

    Linking.getInitialURL().then(handleUrl);
    const linkingSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      sub.subscription.unsubscribe();
      appStateSub.remove();
      linkingSub.remove();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      recoveryMode,
      clearRecoveryMode: () => setRecoveryMode(false),

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw mapAuthError(error.message);
      },

      async signUp({ email, password, fullName, phone }) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone: phone ?? null } },
        });
        if (error) throw mapAuthError(error.message);
        // With "Confirm email" enabled, Supabase returns a fake user with an
        // empty `identities` array when the email is already registered —
        // an anti-enumeration default. Detect it and surface a real error.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new AuthError('Este e-mail já está cadastrado.', 'email');
        }
        return { needsEmailConfirmation: !data.session };
      },

      async signInWithGoogle() {
        const redirectTo = Linking.createURL('auth/callback');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw mapAuthError(error.message);
        if (!data?.url) throw new AuthError('Supabase não retornou a URL de autenticação.');

        // ASWebAuthenticationSession (iOS) and Custom Tabs (Android) can capture
        // a redirect to ANY scheme — including exp:// — because the OS hands the
        // URL back to the calling app instead of opening Safari/Chrome.
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          throw new AuthError('Login com Google cancelado.');
        }
        if (result.type !== 'success' || !result.url) {
          throw new AuthError('Não foi possível concluir o login com Google.');
        }

        const fragment = result.url.split('#')[1] ?? '';
        const params = new URLSearchParams(fragment);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (!access_token || !refresh_token) {
          throw new AuthError('Tokens não encontrados na resposta do Google.');
        }
        const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionErr) throw mapAuthError(sessionErr.message);
      },

      async signOut() {
        // scope:'local' clears the device session without waiting on the network —
        // a global sign-out can hang or fail offline and leave the user stuck.
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
        queryClient.clear();
      },

      async resetPassword(email) {
        const redirectTo = Linking.createURL('auth/reset-password');
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw mapAuthError(error.message);
      },

      async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw mapAuthError(error.message);
      },
    }),
    [session, loading, recoveryMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
