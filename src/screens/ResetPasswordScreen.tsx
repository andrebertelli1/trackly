import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import { PressScale } from '../components/PressScale';
import { FieldLabel, TextField } from './LoginScreen';
import { useAuth } from '../lib/auth';

type Props = {
  /** Called after a successful password update. */
  onDone: () => void;
};

const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function ResetPasswordScreen({ onDone }: Props) {
  const { user, updatePassword, clearRecoveryMode, signOut } = useAuth();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ pw?: string; confirm?: string; top?: string }>({});

  const clearField = (k: 'pw' | 'confirm') =>
    setErrors((prev) => {
      if (!prev[k] && !prev.top) return prev;
      const { [k]: _, top: __, ...rest } = prev;
      return rest;
    });

  const handleSubmit = async () => {
    if (busy) return;
    const next: typeof errors = {};
    if (!pw) next.pw = 'Crie uma senha.';
    else if (!STRONG_PASSWORD.test(pw))
      next.pw = 'Use 8+ caracteres com letras e números.';
    if (pw !== confirm) next.confirm = 'As senhas não coincidem.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await updatePassword(pw);
      setSuccess(true);
    } catch (e) {
      setErrors({ top: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleContinue = () => {
    clearRecoveryMode();
    onDone();
  };

  const handleCancel = async () => {
    // The recovery link signed the user in. If they bail out, drop the session
    // so they don't end up logged in as the account they just tried to reset.
    clearRecoveryMode();
    try {
      await signOut();
    } catch {
      // ignore
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {!success ? (
          <>
            <View className="mt-[18px]">
              <View
                className="items-center justify-center mb-[18px]"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: `${theme.base}15`,
                }}
              >
                <Icon name="shield" size={28} color={theme.base} />
              </View>
              <Text className="text-[28px] font-bold text-ink tracking-[-0.6px] leading-[31px]">
                Nova senha
              </Text>
              <Text className="text-sm text-ink-muted mt-2 leading-[20px]">
                {user?.email ? (
                  <>
                    Defina uma nova senha para{' '}
                    <Text className="font-semibold text-ink">{user.email}</Text>.
                  </>
                ) : (
                  'Defina uma nova senha para sua conta.'
                )}
              </Text>
            </View>

            {errors.top && (
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
                  {errors.top}
                </Text>
              </View>
            )}

            <View className="mt-6">
              <FieldLabel>Nova senha</FieldLabel>
              <TextField
                placeholder="Mínimo 8 caracteres com letra e número"
                value={pw}
                onChangeText={(t) => {
                  setPw(t);
                  clearField('pw');
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
              {errors.pw && (
                <Text
                  className="text-[11px] mt-[6px] ml-[2px]"
                  style={{ color: theme.danger }}
                >
                  {errors.pw}
                </Text>
              )}
            </View>

            <View className="mt-[12px]">
              <FieldLabel>Confirmar senha</FieldLabel>
              <TextField
                placeholder="Repita a nova senha"
                value={confirm}
                onChangeText={(t) => {
                  setConfirm(t);
                  clearField('confirm');
                }}
                secureTextEntry={!show}
              />
              {errors.confirm && (
                <Text
                  className="text-[11px] mt-[6px] ml-[2px]"
                  style={{ color: theme.danger }}
                >
                  {errors.confirm}
                </Text>
              )}
            </View>

            <PressScale
              onPress={handleSubmit}
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
                {busy ? 'Salvando…' : 'Salvar nova senha'}
              </Text>
            </PressScale>

            <View className="flex-1" />

            <Pressable onPress={handleCancel} hitSlop={6} className="mt-6 items-center">
              <Text className="text-[12px] font-semibold text-ink-muted">Cancelar</Text>
            </Pressable>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <View
              className="items-center justify-center mb-5"
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: `${theme.success}1A`,
              }}
            >
              <Icon name="check" size={42} color={theme.success} />
            </View>
            <Text className="text-2xl font-bold text-ink tracking-[-0.5px] leading-[29px]">
              Senha atualizada
            </Text>
            <Text
              className="text-sm text-ink-muted mt-[10px] leading-[21px] text-center"
              style={{ maxWidth: 280 }}
            >
              Sua nova senha já está ativa. Você pode acessar o app agora.
            </Text>

            <PressScale
              onPress={handleContinue}
              style={{
                marginTop: 28,
                paddingVertical: 14,
                paddingHorizontal: 28,
                backgroundColor: theme.text,
                borderRadius: 16,
                alignItems: 'center',
              }}
            >
              <Text className="text-canvas text-[15px] font-bold tracking-[-0.2px]">
                Continuar
              </Text>
            </PressScale>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
