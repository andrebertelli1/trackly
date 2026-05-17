import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { PressScale } from '../components/PressScale';
import { useMyKids } from '../lib/kids';
import {
  useLinkKidToRoute,
  InviteError,
  type ValidatedInvite,
} from '../lib/invite';

type Props = {
  invite: ValidatedInvite;
  code: string;
  onBack: () => void;
  onAddKid: () => void;
  onLinked: () => void;
};

export function PickKidForRouteScreen({
  invite,
  code,
  onBack,
  onAddKid,
  onLinked,
}: Props) {
  const { data: kids = [], isLoading } = useMyKids();
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const link = useLinkKidToRoute();
  const busy = link.isPending;

  // De-dup kids (one entry per id, even if listed twice).
  const uniqueKids = Array.from(new Map(kids.map((k) => [k.id, k])).values());
  const selectedKid = uniqueKids.find((k) => k.id === selectedKidId) ?? null;
  const isAfternoon = invite.route?.period === 'afternoon';
  const previewAddress = selectedKid
    ? isAfternoon
      ? selectedKid.dropoff_address ?? selectedKid.pickup_address
      : selectedKid.pickup_address
    : null;

  const handleLink = async () => {
    if (busy) return;
    setError(null);
    if (!selectedKidId) {
      setError('Selecione uma criança.');
      return;
    }
    try {
      await link.mutateAsync({ code, kid_id: selectedKidId });
      onLinked();
    } catch (e) {
      const friendly = e instanceof InviteError ? e.friendly : (e as Error).message;
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

        <View className="mt-[18px]">
          <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">VINCULAR À VAN</Text>
          <Text className="text-[26px] font-bold text-ink tracking-[-0.6px] mt-[6px] leading-[30px]">
            {invite.route?.van_label
              ? `Van ${invite.route.van_label}`
              : 'Selecionar criança'}
          </Text>
          {invite.school?.name && (
            <Text className="text-sm text-ink-muted mt-[6px]">
              {invite.school.name}
              {invite.school.city ? ` · ${invite.school.city}` : ''}
            </Text>
          )}
        </View>

        {error && (
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
              {error}
            </Text>
          </View>
        )}

        <Text className="mt-6 text-[11px] font-bold text-ink-muted uppercase tracking-[0.6px]">
          Qual criança?
        </Text>

        <View className="mt-[8px] bg-surface rounded-[18px] border border-line overflow-hidden">
          {isLoading ? (
            <View className="py-4 px-[14px]">
              <Text className="text-[13px] text-ink-muted">Carregando crianças…</Text>
            </View>
          ) : uniqueKids.length === 0 ? (
            <View className="py-4 px-[14px]">
              <Text className="text-[13px] text-ink-muted">
                Você ainda não cadastrou nenhuma criança.
              </Text>
            </View>
          ) : (
            uniqueKids.map((k, i) => {
              const on = selectedKidId === k.id;
              const displayShort = k.short_name ?? k.full_name;
              return (
                <Pressable
                  key={k.id}
                  onPress={() => setSelectedKidId(k.id)}
                  className="flex-row gap-3 items-center py-3 px-[14px]"
                  style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
                >
                  <Avatar name={displayShort} size={40} bg={k.color ?? '#888'} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink">{k.full_name}</Text>
                    {k.grade != null && (
                      <Text className="text-[11px] text-ink-muted mt-[1px]">{k.grade}º ano</Text>
                    )}
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: on ? theme.text : theme.lineStrong,
                      backgroundColor: on ? theme.text : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && <Icon name="check" size={12} color="#fff" />}
                  </View>
                </Pressable>
              );
            })
          )}

          <Pressable
            onPress={onAddKid}
            className="flex-row gap-3 items-center py-3 px-[14px]"
            style={{ borderTopWidth: uniqueKids.length ? 1 : 0, borderTopColor: theme.line }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: theme.lineStrong,
              }}
            >
              <Icon name="plus" size={18} color={theme.textMuted} />
            </View>
            <Text className="flex-1 text-sm font-semibold" style={{ color: theme.base }}>
              Criar nova criança
            </Text>
          </Pressable>
        </View>

        {selectedKid && (
          <View
            className="mt-6 p-[12px] rounded-xl flex-row items-start"
            style={{
              gap: 10,
              backgroundColor: `${theme.base}10`,
              borderWidth: 1,
              borderColor: `${theme.base}26`,
            }}
          >
            <View style={{ marginTop: 1 }}>
              <Icon name="pin" size={14} color={theme.base} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-[0.5px]" style={{ color: theme.base }}>
                {isAfternoon ? 'Endereço de desembarque' : 'Endereço de embarque'}
              </Text>
              <Text className="text-[12px] text-ink mt-[2px] leading-[17px]">
                {previewAddress ?? (
                  <Text className="italic" style={{ color: theme.danger }}>
                    Esta criança ainda não tem endereço cadastrado.
                  </Text>
                )}
              </Text>
            </View>
          </View>
        )}

        <View className="flex-1" />

        <PressScale
          onPress={handleLink}
          disabled={busy || !selectedKidId}
          style={{
            marginTop: 24,
            padding: 14,
            backgroundColor: selectedKidId ? theme.text : theme.surfaceAlt,
            borderRadius: 16,
            alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text
            className="text-[15px] font-bold tracking-[-0.2px]"
            style={{ color: selectedKidId ? theme.canvas : theme.textFaint }}
          >
            {busy ? 'Vinculando…' : 'Vincular criança à van'}
          </Text>
        </PressScale>
      </ScrollView>
    </View>
  );
}
