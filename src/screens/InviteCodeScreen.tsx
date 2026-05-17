import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import {
  useValidateInviteCode,
  InviteError,
  type ValidatedInvite,
} from '../lib/invite';

type Props = {
  onBack: () => void;
  /** Called after the user accepts the success state.
   *  Receives the verified code AND the validated invite payload, so the next
   *  step (post-signup linking, or the kid picker) can use it directly. */
  onContinue: (code: string, invite: ValidatedInvite) => void;
};

const CODE_LEN = 6;

export function InviteCodeScreen({ onBack, onContinue }: Props) {
  const [code, setCode] = useState<string[]>(Array(CODE_LEN).fill(''));
  const [result, setResult] = useState<ValidatedInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(TextInput | null)[]>([]);
  const validate = useValidateInviteCode();
  const found = !!result;

  const handleChange = (i: number, v: string) => {
    const clean = v.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 1);
    setCode((prev) => {
      const next = [...prev];
      next[i] = clean;
      return next;
    });
    if (error) setError(null);
    if (clean && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, key: string) => {
    if (key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const filled = code.every((c) => c.length === 1);
  const busy = validate.isPending;
  const codeString = code.join('');

  const handleVerify = async () => {
    if (!filled || busy) return;
    setError(null);
    try {
      // Validation is always anonymous-safe; the actual linking happens on the
      // next screen (picker) where the parent chooses which kid to attach.
      const r = await validate.mutateAsync(codeString);
      setResult(r);
    } catch (e) {
      const friendly =
        e instanceof InviteError ? e.friendly : 'Não foi possível verificar o código.';
      setError(friendly);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>

        {!found ? (
          <>
            <View className="mt-[18px]">
              <View
                className="items-center justify-center mb-[18px]"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: `${theme.warm}1A`,
                }}
              >
                <Icon name="bolt" size={28} color={theme.warm} />
              </View>
              <Text className="text-[28px] font-bold text-ink tracking-[-0.6px] leading-[31px]">
                Código de convite
              </Text>
              <Text className="text-sm text-ink-muted mt-2 leading-[20px]">
                Insira o código de 6 caracteres enviado pela escola. Ele conecta sua conta ao
                motorista certo.
              </Text>
            </View>

            <View
              className="flex-row mt-[26px] self-center items-center justify-center"
              style={{ gap: 8 }}
            >
              {code.map((c, i) => (
                <Pressable
                  key={i}
                  onPress={() => refs.current[i]?.focus()}
                  style={{
                    width: 44,
                    height: 54,
                    backgroundColor: theme.surface,
                    borderWidth: 1.5,
                    borderColor: c ? theme.text : theme.line,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TextInput
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    value={c}
                    onChangeText={(v) => handleChange(i, v)}
                    onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
                    maxLength={1}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    textAlign="center"
                    textAlignVertical="center"
                    style={{
                      width: '100%',
                      height: '100%',
                      fontSize: 24,
                      fontWeight: '700',
                      color: theme.text,
                      padding: 0,
                      includeFontPadding: false,
                    }}
                  />
                </Pressable>
              ))}
            </View>

            <Text className="text-center mt-[14px] text-[11px] text-ink-faint tracking-[0.4px]">
              Exemplo:{' '}
              <Text className="font-semibold text-ink-muted" style={{ fontFamily: 'Courier' }}>
                GF2K9X
              </Text>
            </Text>

            <Pressable
              onPress={handleVerify}
              disabled={!filled || busy}
              className="mt-[22px] p-[14px] rounded-2xl items-center"
              style={{
                backgroundColor: filled ? theme.text : theme.surfaceAlt,
                opacity: busy ? 0.6 : 1,
              }}
            >
              <Text
                className="text-[15px] font-bold tracking-[-0.2px]"
                style={{ color: filled ? theme.canvas : theme.textFaint }}
              >
                {busy ? 'Verificando…' : 'Verificar código'}
              </Text>
            </Pressable>

            {error && (
              <Text
                className="text-[12px] mt-[10px] text-center"
                style={{ color: theme.danger }}
              >
                {error}
              </Text>
            )}

            <View
              className="mt-[18px] p-[11px] rounded-xl flex-row items-center bg-surface border border-line"
              style={{ gap: 10 }}
            >
              <View
                className="bg-surface-alt items-center justify-center"
                style={{ width: 30, height: 30, borderRadius: 9 }}
              >
                <Icon name="chat" size={15} color={theme.textMuted} />
              </View>
              <Text className="flex-1 text-xs text-ink-muted leading-[17px]">
                Não recebeu o código?{' '}
                <Text className="font-semibold" style={{ color: theme.base }}>
                  Falar com a escola
                </Text>
              </Text>
            </View>

            <View className="flex-1" />

            <Text className="text-center text-xs text-ink-faint">
              Sua escola ainda não usa o Trackly?{' '}
              <Text className="font-bold" style={{ color: theme.base }}>
                Indique a Trackly
              </Text>
            </Text>
          </>
        ) : (
          <View className="flex-1">
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
              <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] leading-[26px]">
                Escola encontrada!
              </Text>

              <View
                className="mt-[18px] p-4 rounded-2xl bg-surface border border-line flex-row items-center"
                style={{ gap: 12, maxWidth: 300, width: '100%' }}
              >
                <View
                  className="items-center justify-center"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: theme.warm,
                  }}
                >
                  <Icon name="pin" size={22} color="#fff" filled />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-ink tracking-[-0.3px]">
                    {result?.school?.name ?? 'Escola'}
                  </Text>
                  <Text className="text-[11px] text-ink-muted mt-[2px]">
                    {[result?.school?.city, result?.route?.van_label && `Van ${result.route.van_label}`]
                      .filter(Boolean)
                      .join(' · ') || 'Escola encontrada'}
                  </Text>
                </View>
                <View
                  className="py-[2px] px-2 rounded-full"
                  style={{ backgroundColor: `${theme.success}1A` }}
                >
                  <Text
                    className="text-[10px] font-bold tracking-[0.3px]"
                    style={{ color: theme.success }}
                  >
                    VÁLIDO
                  </Text>
                </View>
              </View>

              <Text
                className="text-[13px] text-ink-muted mt-[14px] leading-[20px] text-center"
                style={{ maxWidth: 300 }}
              >
                Continue para escolher qual filho vai usar essa van.
              </Text>
            </View>

            <Pressable
              onPress={() => result && onContinue(codeString, result)}
              className="p-[14px] bg-ink rounded-2xl items-center"
            >
              <Text className="text-canvas text-[15px] font-bold tracking-[-0.2px]">
                Continuar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setResult(null);
                setError(null);
                setCode(Array(CODE_LEN).fill(''));
              }}
              className="mt-2 p-3 items-center"
            >
              <Text className="text-[13px] font-semibold text-ink-muted">Usar outro código</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
