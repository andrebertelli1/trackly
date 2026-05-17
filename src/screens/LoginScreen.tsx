import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import { PressScale } from '../components/PressScale';
import { useAuth } from '../lib/auth';

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onForgot: () => void;
  onDriverDemo: () => void;
};

export function LoginScreen({ onBack, onLogin, onRegister, onForgot, onDriverDemo }: Props) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [topError, setTopError] = useState<string | null>(null);

  const handleEmail = async () => {
    if (busy) return;
    setTopError(null);
    if (!email.trim() || !pw) {
      setTopError('Informe e-mail e senha.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), pw);
      onLogin();
    } catch (e) {
      setTopError((e as Error).message);
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
      onLogin();
    } catch (e) {
      setTopError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} hitSlop={10}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>

        <View className="mt-[18px]">
          <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">TRACKLY</Text>
          <Text className="text-[30px] font-bold text-ink tracking-[-0.7px] mt-[6px] leading-[33px]">
            Entrar
          </Text>
          <Text className="text-sm text-ink-muted mt-[6px] leading-5">
            Acesse sua conta para acompanhar a viagem do seu filho em tempo real.
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
          className="mt-[22px] p-[13px] bg-surface border border-line rounded-2xl flex-row items-center justify-center"
          style={{ gap: 10, opacity: busy ? 0.6 : 1 }}
        >
          <GoogleG size={18} />
          <Text className="text-[15px] font-semibold text-ink">Continuar com Google</Text>
        </Pressable>

        <View className="my-[18px] flex-row items-center" style={{ gap: 10 }}>
          <View className="flex-1 h-px bg-line" />
          <Text className="text-[11px] font-semibold text-ink-faint uppercase tracking-[0.5px]">
            ou com e-mail
          </Text>
          <View className="flex-1 h-px bg-line" />
        </View>

        <FieldLabel>E-mail</FieldLabel>
        <TextField
          placeholder="voce@exemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={{ height: 12 }} />

        <View className="flex-row justify-between items-baseline">
          <FieldLabel>Senha</FieldLabel>
          <Pressable onPress={onForgot} hitSlop={6}>
            <Text
              className="text-[11px] font-semibold mb-[6px]"
              style={{ color: theme.base }}
            >
              Esqueceu?
            </Text>
          </Pressable>
        </View>
        <TextField
          placeholder="••••••••"
          value={pw}
          onChangeText={setPw}
          secureTextEntry={!show}
          right={
            <Pressable onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Text className="text-[11px] font-semibold text-ink-muted">
                {show ? 'Ocultar' : 'Mostrar'}
              </Text>
            </Pressable>
          }
        />

        <PressScale
          onPress={handleEmail}
          disabled={busy}
          style={{
            marginTop: 18,
            padding: 14,
            backgroundColor: theme.text,
            borderRadius: 16,
            alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text className="text-canvas text-[15px] font-bold tracking-[-0.2px]">
            {busy ? 'Entrando…' : 'Entrar'}
          </Text>
        </PressScale>

        <View className="mt-[18px] flex-row items-center justify-center">
          <Text className="text-[13px] text-ink-muted">Ainda não tem conta? </Text>
          <Pressable onPress={onRegister} hitSlop={6}>
            <Text className="text-[13px] font-bold" style={{ color: theme.base }}>
              Cadastre-se
            </Text>
          </Pressable>
        </View>

        <View
          className="mt-6 p-[12px] rounded-xl flex-row items-start"
          style={{
            gap: 10,
            backgroundColor: `${theme.warm}12`,
            borderWidth: 1,
            borderColor: `${theme.warm}33`,
          }}
        >
          <View style={{ marginTop: 1 }}>
            <Icon name="shield" size={16} color={theme.warm} />
          </View>
          <Text className="flex-1 text-[11px] text-ink-muted leading-[16px]">
            Motoristas são cadastrados diretamente pela administração da escola.
          </Text>
        </View>

        <View className="flex-1" />

        <Pressable onPress={onDriverDemo} hitSlop={8} className="mt-6 items-center">
          <Text className="text-[11px] text-ink-faint">Modo motorista (demo)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.4px] mb-[6px]">
      {children}
    </Text>
  );
}

type TextFieldProps = React.ComponentProps<typeof TextInput> & {
  right?: React.ReactNode;
};

export function TextField({ right, style, ...inputProps }: TextFieldProps) {
  return (
    <View
      className="flex-row items-center bg-surface border border-line rounded-[13px]"
      style={{ gap: 8, paddingHorizontal: 14, paddingVertical: 12 }}
    >
      <TextInput
        {...inputProps}
        placeholderTextColor={theme.textFaint}
        style={[{ flex: 1, color: theme.text, fontSize: 14, padding: 0 }, style]}
      />
      {right}
    </View>
  );
}

export function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.88 2.69-6.62Z"
        fill="#4285F4"
      />
      <Path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <Path
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.94a9 9 0 0 0 0 8.06l3.01-2.33Z"
        fill="#FBBC05"
      />
      <Path
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .94 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </Svg>
  );
}
