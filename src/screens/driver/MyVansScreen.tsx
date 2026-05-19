import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Share } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/Icon';
import { PressScale } from '../../components/PressScale';
import {
  useMyVans,
  useGenerateInviteCode,
  useRevokeInviteCode,
  useAddDirectionToVan,
  type DriverVan,
} from '../../lib/driver';

type Props = {
  onBack: () => void;
  onCreate: () => void;
  onEdit: (vanId: string) => void;
};

export function MyVansScreen({ onBack, onCreate, onEdit }: Props) {
  const { data: vans = [], isLoading } = useMyVans();

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-3 flex-row items-center" style={{ gap: 8 }}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Minhas vans</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {!isLoading && vans.length === 0 && (
          <View
            className="mt-2 p-4 rounded-[18px] bg-surface flex-row items-start"
            style={{
              gap: 12,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: theme.lineStrong,
            }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: `${theme.warm}1A`,
              }}
            >
              <Icon name="bolt" size={20} color={theme.warm} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-ink">Nenhuma van criada</Text>
              <Text className="text-[12px] text-ink-muted mt-[2px] leading-[17px]">
                Crie sua primeira van pra começar a gerar códigos e receber estudantes.
              </Text>
            </View>
          </View>
        )}

        {vans.map((v) => (
          <VanCard key={v.id} van={v} onEdit={() => onEdit(v.id)} />
        ))}

        <PressScale
          onPress={onCreate}
          style={{
            marginTop: 16,
            padding: 14,
            backgroundColor: theme.text,
            borderRadius: 16,
            alignItems: 'center',
          }}
        >
          <Text className="text-canvas text-[15px] font-bold tracking-[-0.2px]">
            Criar nova van
          </Text>
        </PressScale>
      </ScrollView>
    </View>
  );
}

function VanCard({ van, onEdit }: { van: DriverVan; onEdit: () => void }) {
  const [showAllCodes, setShowAllCodes] = useState(false);
  const generate = useGenerateInviteCode();
  const revoke = useRevokeInviteCode();
  const addDirection = useAddDirectionToVan();
  const now = new Date();
  const activeCodes = van.invite_codes.filter(
    (c) => new Date(c.expires_at) > now && c.redemptions_used < c.max_redemptions,
  );
  const visibleCodes = showAllCodes ? van.invite_codes : activeCodes;

  const hasPickup = van.routes.some((r) => r.direction === 'pickup');
  const hasDropoff = van.routes.some((r) => r.direction === 'dropoff');
  const missingDirection = !hasPickup ? 'pickup' : !hasDropoff ? 'dropoff' : null;

  const handleGenerate = async () => {
    try {
      const code = await generate.mutateAsync({ van_id: van.id });
      Alert.alert('Código gerado', `Seu novo código: ${code}\n\nCompartilhe com os pais.`, [
        { text: 'OK' },
        {
          text: 'Compartilhar',
          onPress: () =>
            Share.share({
              message: `Olá! Use este código de convite no app Trackly pra vincular seu filho à minha van (${van.van_label}): ${code}`,
            }).catch(() => {}),
        },
      ]);
    } catch (e) {
      Alert.alert('Erro ao gerar código', (e as Error).message);
    }
  };

  const handleShare = (code: string) =>
    Share.share({
      message: `Olá! Use este código de convite no app Trackly pra vincular seu filho à minha van (${van.van_label}): ${code}`,
    }).catch(() => {});

  const handleRevoke = (code: string) =>
    Alert.alert(
      'Revogar código?',
      `O código ${code} deixará de funcionar. Pais já vinculados continuam vinculados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revoke.mutateAsync(code);
            } catch (e) {
              Alert.alert('Erro', (e as Error).message);
            }
          },
        },
      ],
    );

  const handleAddDirection = () => {
    if (!missingDirection) return;
    const isPickup = missingDirection === 'pickup';
    Alert.prompt?.(
      isPickup ? 'Adicionar embarque' : 'Adicionar desembarque',
      'Horário (HH:MM-HH:MM) — ex.: 07:30-08:15',
      async (input?: string) => {
        if (!input) return;
        const m = input.trim().match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
        if (!m || !m[1] || !m[2]) {
          Alert.alert('Formato inválido', 'Use HH:MM-HH:MM.');
          return;
        }
        try {
          await addDirection.mutateAsync({
            van_id: van.id,
            direction: missingDirection,
            pickup_start: `${m[1]}:00`,
            arrival_time: `${m[2]}:00`,
          });
        } catch (e) {
          Alert.alert('Erro', (e as Error).message);
        }
      },
    );
  };

  return (
    <View
      className="mt-3 p-4 rounded-[18px] bg-surface"
      style={{ borderWidth: 1, borderColor: theme.line }}
    >
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <View
          className="items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            backgroundColor: van.van_color ? `${van.van_color}22` : `${theme.base}1A`,
          }}
        >
          <Icon name="car" size={22} color={van.van_color ?? theme.base} filled />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink tracking-[-0.2px]">
            Van {van.van_label}
          </Text>
          <Text className="text-[12px] text-ink-muted mt-[1px]">
            {van.school?.name ?? 'Sem escola'}
            {van.school?.city ? ` · ${van.school.city}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <View
            className="py-[2px] px-2 rounded-full"
            style={{ backgroundColor: `${theme.success}1A` }}
          >
            <Text
              className="text-[10px] font-bold tracking-[0.3px]"
              style={{ color: theme.success }}
            >
              {van.kid_count} {van.kid_count === 1 ? 'ESTUDANTE' : 'ESTUDANTES'}
            </Text>
          </View>
          <Pressable onPress={onEdit} hitSlop={6}>
            <Text className="text-[11px] font-semibold" style={{ color: theme.base }}>
              Editar
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.5px]">
          Rotas
        </Text>
        {van.routes.map((r, i) => (
          <View
            key={r.id}
            className="mt-2 flex-row items-center"
            style={{ gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: theme.line, paddingTop: i ? 8 : 0 }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 9,
                backgroundColor: `${theme.base}1A`,
              }}
            >
              <Icon
                name={r.direction === 'pickup' ? 'route' : 'pin'}
                size={14}
                color={theme.base}
              />
            </View>
            <Text className="flex-1 text-[13px] font-semibold text-ink">
              {r.direction === 'pickup' ? 'Embarque' : 'Desembarque'}
              {r.pickup_start && r.arrival_time ? (
                <Text className="font-medium text-ink-muted">
                  {' · '}
                  {formatTime(r.pickup_start)}–{formatTime(r.arrival_time)}
                </Text>
              ) : null}
            </Text>
          </View>
        ))}
        {missingDirection && (
          <Pressable
            onPress={handleAddDirection}
            className="mt-2 py-2 items-center bg-surface-alt rounded-xl"
          >
            <Text className="text-[12px] font-semibold" style={{ color: theme.base }}>
              + Adicionar {missingDirection === 'pickup' ? 'embarque' : 'desembarque'}
            </Text>
          </Pressable>
        )}
      </View>

      <View className="mt-4">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.5px]">
            Códigos de convite
          </Text>
          {van.invite_codes.length > activeCodes.length && (
            <Pressable onPress={() => setShowAllCodes((v) => !v)} hitSlop={6}>
              <Text className="text-[11px] font-semibold" style={{ color: theme.base }}>
                {showAllCodes ? 'Só ativos' : 'Mostrar todos'}
              </Text>
            </Pressable>
          )}
        </View>

        {visibleCodes.length === 0 && (
          <Text className="text-[12px] text-ink-muted mt-2">
            Nenhum código ativo. Gere um abaixo.
          </Text>
        )}

        {visibleCodes.map((c) => {
          const expired = new Date(c.expires_at) <= now;
          const maxed = c.redemptions_used >= c.max_redemptions;
          const inactive = expired || maxed;
          return (
            <View
              key={c.code}
              className="mt-2 flex-row items-center bg-surface-alt rounded-xl"
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                gap: 10,
                opacity: inactive ? 0.55 : 1,
              }}
            >
              <Text
                className="text-[16px] font-bold tracking-[2px] text-ink"
                style={{ fontFamily: 'Courier' }}
              >
                {c.code}
              </Text>
              <View className="flex-1">
                <Text className="text-[11px] text-ink-muted">
                  {c.redemptions_used}/{c.max_redemptions} usos
                  {expired ? ' · expirado' : maxed ? ' · esgotado' : ''}
                </Text>
              </View>
              {!inactive && (
                <>
                  <Pressable onPress={() => handleShare(c.code)} hitSlop={6}>
                    <Text className="text-[12px] font-semibold" style={{ color: theme.base }}>
                      Compartilhar
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => handleRevoke(c.code)} hitSlop={6}>
                    <Text className="text-[12px] font-semibold" style={{ color: theme.danger }}>
                      Revogar
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          );
        })}

        <PressScale
          onPress={handleGenerate}
          disabled={generate.isPending}
          style={{
            marginTop: 10,
            padding: 11,
            backgroundColor: `${theme.warm}1A`,
            borderRadius: 12,
            alignItems: 'center',
            opacity: generate.isPending ? 0.6 : 1,
          }}
        >
          <Text className="text-[13px] font-bold" style={{ color: theme.warm }}>
            {generate.isPending ? 'Gerando…' : '+ Gerar novo código'}
          </Text>
        </PressScale>
      </View>
    </View>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(':');
  return `${Number(h)}:${m}`;
}
