import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import { PressScale } from '../components/PressScale';
import { FieldLabel, TextField, GoogleG } from './LoginScreen';
import { useAuth, AuthError, type AuthField } from '../lib/auth';

type Props = {
  onLogin: () => void;
  onSubmit: () => void;
};

type FieldErrors = Partial<Record<NonNullable<AuthField>, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function RegisterScreen({ onLogin, onSubmit }: Props) {
  const { signUp, signInWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [accept, setAccept] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  const clearError = (field: NonNullable<AuthField>) => {
    if (errors[field] || topError) {
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const { [field]: _, ...rest } = prev;
        return rest;
      });
      setTopError(null);
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = 'Informe seu nome.';
    if (!email.trim()) next.email = 'Informe seu e-mail.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'E-mail inválido.';
    if (!pw) next.password = 'Crie uma senha.';
    else if (pw.length < 8) next.password = 'Use ao menos 8 caracteres.';
    else if (!STRONG_PASSWORD.test(pw))
      next.password = 'Use letras e números (8+ caracteres).';
    return next;
  };

  const handleSignup = async () => {
    if (busy) return;
    setTopError(null);
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password: pw,
        fullName: name.trim(),
        phone: phone.trim() || undefined,
      });
      if (result.needsEmailConfirmation) {
        Alert.alert(
          'Verifique seu e-mail',
          `Enviamos um link de confirmação para ${email.trim()}. Confirme e depois faça login.`,
          [{ text: 'OK', onPress: onLogin }],
        );
        return;
      }
      onSubmit();
    } catch (e) {
      const err = e as AuthError | Error;
      if (err instanceof AuthError && err.field) {
        setErrors({ [err.field]: err.message });
      } else {
        setTopError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setTopError(null);
    try {
      await signInWithGoogle();
      onSubmit();
    } catch (e) {
      setTopError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 4, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onLogin} hitSlop={10}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>

        <View className="mt-[14px]">
          <Text className="text-[28px] font-bold text-ink tracking-[-0.6px] leading-[31px]">
            Criar conta
          </Text>
          <Text className="text-sm text-ink-muted mt-2 leading-5">
            Leva menos de um minuto. A escola conecta a sua conta ao motorista certo.
          </Text>
        </View>

        {topError && (
          <View
            className="mt-[14px] p-[11px] rounded-xl flex-row items-start"
            style={{
              gap: 10,
              backgroundColor: `${theme.danger}15`,
              borderWidth: 1,
              borderColor: `${theme.danger}40`,
            }}
          >
            <View style={{ marginTop: 1 }}>
              <Icon name="shield" size={14} color={theme.danger} />
            </View>
            <Text className="flex-1 text-[12px] leading-[17px]" style={{ color: theme.danger }}>
              {topError}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleGoogle}
          disabled={busy}
          className="mt-[18px] p-3 bg-surface border border-line rounded-2xl flex-row items-center justify-center"
          style={{ gap: 10, opacity: busy ? 0.6 : 1 }}
        >
          <GoogleG size={16} />
          <Text className="text-sm font-semibold text-ink">Cadastrar com Google</Text>
        </Pressable>

        <View className="my-[14px] mt-[18px] flex-row items-center" style={{ gap: 10 }}>
          <View className="flex-1 h-px bg-line" />
          <Text className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.5px]">
            ou
          </Text>
          <View className="flex-1 h-px bg-line" />
        </View>

        <FieldLabel>Nome completo</FieldLabel>
        <TextField
          placeholder="Como devemos te chamar?"
          value={name}
          onChangeText={(t) => {
            setName(t);
            clearError('name');
          }}
        />
        <FieldErrorText error={errors.name} />

        <View style={{ height: 10 }} />

        <FieldLabel>E-mail</FieldLabel>
        <TextField
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            clearError('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FieldErrorText error={errors.email} />

        <View style={{ height: 10 }} />

        <View className="flex-row items-baseline" style={{ gap: 6 }}>
          <FieldLabel>Telefone</FieldLabel>
          <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">(opcional)</Text>
        </View>
        <TextField
          placeholder="(11) 9 9999-9999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <View style={{ height: 10 }} />

        <FieldLabel>Senha</FieldLabel>
        <TextField
          placeholder="Mínimo 8 caracteres com letra e número"
          value={pw}
          onChangeText={(t) => {
            setPw(t);
            clearError('password');
          }}
          secureTextEntry={!show}
          right={
            <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Text className="text-[11px] font-semibold text-ink-muted">
                {show ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Pressable>
          }
        />
        <FieldErrorText error={errors.password} />

        <View
          className="mt-[14px] p-[11px] rounded-xl flex-row items-start"
          style={{
            gap: 10,
            backgroundColor: `${theme.base}10`,
            borderWidth: 1,
            borderColor: `${theme.base}26`,
          }}
        >
          <View style={{ marginTop: 1 }}>
            <Icon name="user" size={14} color={theme.base} />
          </View>
          <Text className="flex-1 text-[11px] text-ink-muted leading-[16px]">
            Sua conta será criada como <Text className="font-semibold text-ink">responsável</Text>.
            A escola define os demais perfis.
          </Text>
        </View>

        <View className="mt-[14px] flex-row items-start" style={{ gap: 10 }}>
          <Pressable
            onPress={() => setAccept((a) => !a)}
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              marginTop: 1,
              backgroundColor: accept ? theme.base : 'transparent',
              borderWidth: accept ? 0 : 1.5,
              borderColor: theme.lineStrong,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {accept && <Icon name="check" size={12} color="#fff" />}
          </Pressable>
          <Text className="flex-1 text-xs text-ink-muted leading-[17px]">
            Li e aceito os <Text className="font-semibold text-ink">Termos de uso</Text> e a{' '}
            <Text className="font-semibold text-ink">Política de privacidade</Text>.
          </Text>
        </View>

        <PressScale
          onPress={accept && !busy ? handleSignup : undefined}
          disabled={!accept || busy}
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 16,
            alignItems: 'center',
            backgroundColor: accept ? theme.text : theme.surfaceAlt,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text
            className="text-[15px] font-bold tracking-[-0.2px]"
            style={{ color: accept ? theme.canvas : theme.textFaint }}
          >
            {busy ? 'Criando…' : 'Criar conta'}
          </Text>
        </PressScale>

        <View className="mt-[14px] flex-row items-center justify-center">
          <Text className="text-[13px] text-ink-muted">Já tem conta? </Text>
          <Pressable onPress={onLogin} hitSlop={6}>
            <Text className="text-[13px] font-bold" style={{ color: theme.base }}>
              Entrar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function FieldErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <Text className="text-[11px] mt-[6px] ml-[2px]" style={{ color: theme.danger }}>
      {error}
    </Text>
  );
}
