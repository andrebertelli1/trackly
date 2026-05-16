import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { theme } from '../../theme';
import { ROSTER, type RosterKid } from '../../data';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';

type Status = 'waiting' | 'on' | 'off' | 'noshow';

const SHEET_OPTIONS: { icon: 'bolt' | 'route' | 'shield'; label: string; danger?: boolean }[] = [
  { icon: 'bolt', label: 'Avisar responsáveis sobre atraso' },
  { icon: 'route', label: 'Reportar desvio' },
  { icon: 'shield', label: 'Emergência / SOS', danger: true },
];

export function DriverCheckinScreen() {
  const [statuses, setStatuses] = useState<Status[]>(['on', 'on', 'waiting', 'waiting', 'waiting']);
  const [confirm, setConfirm] = useState<number | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  const set = (i: number, v: Status) => {
    setStatuses((s) => s.map((x, idx) => (idx === i ? v : x)));
    setConfirm(i);
    setTimeout(() => setConfirm((c) => (c === i ? null : c)), 1400);
  };

  const onCount = statuses.filter((s) => s === 'on').length;
  const nextIdx = statuses.findIndex((s) => s === 'waiting');
  const nextKid = nextIdx >= 0 ? ROSTER[nextIdx] : null;

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.5px]">
            Embarque da manhã · Van VK-32
          </Text>
          <Text className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-[2px]">Check-in</Text>
        </View>
        <View
          className="py-1 px-[10px] rounded-full"
          style={{ backgroundColor: `${theme.success}22` }}
        >
          <Text className="text-[11px] font-bold text-success tracking-[0.3px]">
            {onCount}/{ROSTER.length} EMBARCADOS
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
        {nextKid ? (
          <View
            className="mx-4 mb-[14px] rounded-[22px] overflow-hidden bg-brand"
            style={{
              shadowColor: theme.base,
              shadowOpacity: 0.25,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          >
            <View className="px-[18px] pt-4 flex-row items-center gap-3">
              <Avatar name={nextKid.name} size={52} bg={nextKid.color} />
              <View className="flex-1">
                <Text className="text-white/85 text-[10px] font-bold tracking-[0.8px]">
                  PRÓX. · {nextKid.time}
                </Text>
                <Text className="text-white text-[19px] font-bold tracking-[-0.4px]">
                  {nextKid.name}
                </Text>
                <Text className="text-white/85 text-xs">{nextKid.addr}</Text>
              </View>
              <View className="w-[38px] h-[38px] rounded-full bg-white/20 items-center justify-center">
                <Icon name="phone" size={16} color="#fff" />
              </View>
            </View>
            <View className="flex-row gap-2 px-[18px] pt-[14px] pb-[18px]">
              <Pressable
                onPress={() => set(nextIdx, 'on')}
                className="flex-[2] py-[14px] rounded-[14px] bg-white flex-row items-center justify-center gap-2"
              >
                <Icon name="check" size={18} color={theme.base} />
                <Text className="text-[15px] font-bold tracking-[-0.2px]" style={{ color: theme.base }}>
                  Embarcar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => set(nextIdx, 'noshow')}
                className="flex-1 py-[14px] px-[10px] rounded-[14px] bg-white/20 items-center justify-center"
              >
                <Text className="text-white text-[13px] font-semibold">Faltou</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            className="mx-4 mb-[14px] py-[18px] px-[18px] rounded-[22px] flex-row items-center gap-[14px] bg-success"
            style={{
              shadowColor: theme.success,
              shadowOpacity: 0.25,
              shadowRadius: 32,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          >
            <View className="w-[46px] h-[46px] rounded-full bg-white/20 items-center justify-center">
              <Icon name="check" size={26} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-[17px] font-bold tracking-[-0.3px]">
                Todos embarcados!
              </Text>
              <Text className="text-white/90 text-xs">
                A caminho da Escola Greenfield · Prev. 8:42
              </Text>
            </View>
          </View>
        )}

        <View className="px-4">
          <Text className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.6px] mx-[6px] mb-2 mt-1">
            Lista
          </Text>
          <View className="gap-2">
            {ROSTER.map((k, i) => (
              <RosterRow
                key={i}
                k={k}
                status={statuses[i]!}
                flash={confirm === i}
                onBoard={() => set(i, 'on')}
                onDrop={() => set(i, 'off')}
                onNoshow={() => set(i, 'noshow')}
                onUndo={() => set(i, 'waiting')}
              />
            ))}
          </View>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={() => setShowSheet(true)}
              className="flex-1 py-3 rounded-xl bg-surface border border-line flex-row items-center justify-center gap-2"
            >
              <Icon name="menu" size={16} color={theme.text} />
              <Text className="text-ink text-[13px] font-semibold">Opções da viagem</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setStatuses(['waiting', 'waiting', 'waiting', 'waiting', 'waiting'])
              }
              className="py-3 px-[14px] rounded-xl border border-line"
            >
              <Text className="text-ink-muted text-[13px] font-semibold">Resetar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <Pressable className="flex-1 bg-black/45 justify-end" onPress={() => setShowSheet(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-surface rounded-t-[22px] px-4 pt-[10px] pb-7"
          >
            <View className="w-9 h-1 rounded-sm bg-line-strong self-center mt-1 mb-[14px]" />
            <Text className="text-base font-bold text-ink mb-[10px]">Opções da viagem</Text>
            {SHEET_OPTIONS.map((o, i) => (
              <View
                key={i}
                className="flex-row items-center gap-3 py-[13px] px-1"
                style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
              >
                <Icon name={o.icon} size={20} color={o.danger ? theme.danger : theme.text} />
                <Text
                  className="flex-1 text-sm font-semibold"
                  style={{ color: o.danger ? theme.danger : theme.text }}
                >
                  {o.label}
                </Text>
                <Icon name="chevron" size={16} color={theme.textFaint} />
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type RowProps = {
  k: RosterKid;
  status: Status;
  flash: boolean;
  onBoard: () => void;
  onDrop: () => void;
  onNoshow: () => void;
  onUndo: () => void;
};

function RosterRow({ k, status, flash, onBoard, onDrop, onNoshow, onUndo }: RowProps) {
  const palette =
    status === 'waiting'
      ? { bg: theme.surface, border: theme.line, badgeBg: theme.surfaceAlt, badgeFg: theme.textMuted, label: 'AGUARDANDO' }
      : status === 'on'
        ? { bg: theme.surface, border: `${theme.success}55`, badgeBg: `${theme.success}1A`, badgeFg: theme.success, label: 'EMBARCADO' }
        : status === 'off'
          ? { bg: theme.surfaceAlt, border: theme.line, badgeBg: `${theme.base}1A`, badgeFg: theme.base, label: 'DESEMBARCADO' }
          : { bg: theme.surface, border: `${theme.danger}40`, badgeBg: `${theme.danger}18`, badgeFg: theme.danger, label: 'FALTOU' };

  return (
    <View
      className="p-3 px-[14px] rounded-2xl"
      style={{
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
        shadowColor: theme.success,
        shadowOpacity: flash ? 0.2 : 0,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: flash ? 3 : 0,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View className="relative">
          <Avatar name={k.name} size={42} bg={k.color} />
          {status === 'on' && (
            <View
              className="absolute -bottom-[2px] -right-[2px] w-[18px] h-[18px] rounded-full bg-success items-center justify-center"
              style={{ borderWidth: 2, borderColor: theme.surface }}
            >
              <Icon name="check" size={11} color="#fff" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-ink">{k.name}</Text>
            <View
              className="py-[2px] px-[7px] rounded-full"
              style={{ backgroundColor: palette.badgeBg }}
            >
              <Text className="text-[10px] font-bold" style={{ color: palette.badgeFg }}>
                {palette.label}
              </Text>
            </View>
          </View>
          <Text className="text-[11px] text-ink-muted mt-[2px]">
            {k.addr} · {k.time} · Resp.: {k.parent}
          </Text>
        </View>
      </View>

      <View className="mt-[10px] flex-row gap-[6px]">
        {status === 'waiting' && (
          <>
            <Pressable
              onPress={onBoard}
              className="flex-[2] py-[11px] rounded-[11px] bg-success flex-row items-center justify-center gap-[6px]"
            >
              <Icon name="check" size={14} color="#fff" />
              <Text className="text-white text-[13px] font-bold tracking-[-0.1px]">Embarcar</Text>
            </Pressable>
            <Pressable
              onPress={onNoshow}
              className="flex-1 py-[11px] rounded-[11px] bg-surface-alt items-center justify-center"
            >
              <Text className="text-ink-muted text-xs font-semibold">Faltou</Text>
            </Pressable>
          </>
        )}
        {status === 'on' && (
          <>
            <Pressable
              onPress={onDrop}
              className="flex-[2] py-[11px] rounded-[11px] items-center justify-center"
              style={{ backgroundColor: `${theme.base}15` }}
            >
              <Text className="text-[13px] font-bold" style={{ color: theme.base }}>
                Marcar desembarque
              </Text>
            </Pressable>
            <Pressable
              onPress={onUndo}
              className="flex-1 py-[11px] rounded-[11px] border border-line items-center justify-center"
            >
              <Text className="text-ink-muted text-xs font-semibold">Desfazer</Text>
            </Pressable>
          </>
        )}
        {(status === 'off' || status === 'noshow') && (
          <Pressable
            onPress={onUndo}
            className="flex-1 py-[10px] rounded-[11px] border border-line items-center justify-center"
          >
            <Text className="text-ink-muted text-xs font-semibold">Desfazer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
