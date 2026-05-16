import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import { FieldLabel, TextField } from './LoginScreen';

type Props = {
  onBack: () => void;
};

export function ForgotPasswordScreen({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={onBack} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>

        {!sent ? (
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
                Recuperar senha
              </Text>
              <Text className="text-sm text-ink-muted mt-2 leading-[20px]">
                Digite o e-mail da sua conta. Enviaremos um link seguro para você criar uma nova senha.
              </Text>
            </View>

            <View className="mt-6">
              <FieldLabel>E-mail</FieldLabel>
              <TextField
                placeholder="voce@exemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Pressable
              onPress={() => setSent(true)}
              className="mt-[18px] p-[14px] bg-ink rounded-2xl items-center"
            >
              <Text className="text-canvas text-[15px] font-bold tracking-[-0.2px]">
                Enviar link de recuperação
              </Text>
            </Pressable>

            <View
              className="mt-5 p-[11px] rounded-xl flex-row items-start"
              style={{
                gap: 10,
                backgroundColor: `${theme.warm}12`,
                borderWidth: 1,
                borderColor: `${theme.warm}33`,
              }}
            >
              <View style={{ marginTop: 1 }}>
                <Icon name="bell" size={16} color={theme.warm} />
              </View>
              <Text className="flex-1 text-[11px] text-ink-muted leading-[16px]">
                Verifique também a pasta de spam. O link expira em 30 minutos por segurança.
              </Text>
            </View>

            <View className="flex-1" />

            <View className="flex-row items-center justify-center">
              <Text className="text-[13px] text-ink-muted">Lembrou a senha? </Text>
              <Pressable onPress={onBack} hitSlop={6}>
                <Text className="text-[13px] font-bold" style={{ color: theme.base }}>
                  Voltar ao login
                </Text>
              </Pressable>
            </View>
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
                position: 'relative',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 50,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: `${theme.success}55`,
                }}
              />
              <Icon name="check" size={42} color={theme.success} />
            </View>
            <Text className="text-2xl font-bold text-ink tracking-[-0.5px] leading-[29px]">
              Verifique seu e-mail
            </Text>
            <Text
              className="text-sm text-ink-muted mt-[10px] leading-[21px] text-center"
              style={{ maxWidth: 280 }}
            >
              Enviamos um link de recuperação para{'\n'}
              <Text className="font-semibold text-ink">{email || 'voce@exemplo.com'}</Text>
            </Text>
            <View className="mt-[14px] flex-row items-center">
              <Text className="text-xs text-ink-faint">Não recebeu em alguns minutos? </Text>
              <Pressable hitSlop={6}>
                <Text className="text-xs font-semibold" style={{ color: theme.base }}>
                  Reenviar
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
