import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/Avatar';
import { PressScale } from '../../components/PressScale';
import { FieldLabel, TextField } from '../LoginScreen';
import {
  useMyVans,
  useUpdateVan,
  useAddDirectionToVan,
  useKidsOnVan,
} from '../../lib/driver';

type Props = {
  vanId: string;
  onBack: () => void;
  onDone: () => void;
  onAddUnregistered: (vanId: string) => void;
};

const COLOR_OPTIONS = ['#5B7A9F', '#3A5BD9', '#1F7A4E', '#9F5BC0', '#D04F3C'] as const;
const TIME_RE = /^([0-1]?\d|2[0-3]):[0-5]\d$/;

function timeIn(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  return `${(h ?? '00').padStart(2, '0')}:${m ?? '00'}`;
}

function timeOut(t: string): string | null | 'invalid' {
  const trimmed = t.trim();
  if (!trimmed) return null;
  if (!TIME_RE.test(trimmed)) return 'invalid';
  const [h, m] = trimmed.split(':');
  return `${(h ?? '00').padStart(2, '0')}:${m ?? '00'}:00`;
}

export function EditVanScreen({ vanId, onBack, onDone, onAddUnregistered }: Props) {
  const { data: vans = [] } = useMyVans();
  const van = vans.find((v) => v.id === vanId);
  const { data: kids = [] } = useKidsOnVan(vanId);
  const updateVan = useUpdateVan();
  const updateRoute = useAddDirectionToVan();

  const [vanLabel, setVanLabel] = useState('');
  const [vanColor, setVanColor] = useState<string>(COLOR_OPTIONS[0]);

  const pickup = van?.routes.find((r) => r.direction === 'pickup');
  const dropoff = van?.routes.find((r) => r.direction === 'dropoff');

  const [hasPickup, setHasPickup] = useState(false);
  const [pickupStart, setPickupStart] = useState('');
  const [pickupEnd, setPickupEnd] = useState('');
  const [hasDropoff, setHasDropoff] = useState(false);
  const [dropoffStart, setDropoffStart] = useState('');
  const [dropoffEnd, setDropoffEnd] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!van || hydrated) return;
    setVanLabel(van.van_label);
    setVanColor(van.van_color ?? COLOR_OPTIONS[0]);
    setHasPickup(!!pickup);
    setPickupStart(timeIn(pickup?.pickup_start ?? null));
    setPickupEnd(timeIn(pickup?.arrival_time ?? null));
    setHasDropoff(!!dropoff);
    setDropoffStart(timeIn(dropoff?.pickup_start ?? null));
    setDropoffEnd(timeIn(dropoff?.arrival_time ?? null));
    setHydrated(true);
  }, [van, pickup, dropoff, hydrated]);

  const busy = updateVan.isPending || updateRoute.isPending;

  if (!van) {
    return (
      <View className="flex-1 bg-canvas">
        <View className="px-5 pt-1 pb-3 flex-row items-center" style={{ gap: 8 }}>
          <Pressable onPress={onBack} hitSlop={10}>
            <Icon name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Editar van</Text>
        </View>
        <Text className="mt-4 mx-5 text-[13px] text-ink-muted">Van não encontrada.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (busy) return;
    setError(null);
    if (!vanLabel.trim()) return setError('Informe a placa/etiqueta da van.');
    if (!hasPickup && !hasDropoff)
      return setError('A van precisa ter pelo menos uma direção ativa.');

    let pickupTimes: { start: string | null; end: string | null } | null = null;
    if (hasPickup) {
      const a = timeOut(pickupStart);
      const b = timeOut(pickupEnd);
      if (a === 'invalid' || b === 'invalid')
        return setError('Horários de embarque inválidos. Use HH:MM.');
      pickupTimes = { start: a, end: b };
    }
    let dropoffTimes: { start: string | null; end: string | null } | null = null;
    if (hasDropoff) {
      const a = timeOut(dropoffStart);
      const b = timeOut(dropoffEnd);
      if (a === 'invalid' || b === 'invalid')
        return setError('Horários de desembarque inválidos. Use HH:MM.');
      dropoffTimes = { start: a, end: b };
    }

    try {
      // Update label/color if changed.
      if (vanLabel.trim() !== van.van_label || vanColor !== (van.van_color ?? '')) {
        await updateVan.mutateAsync({
          van_id: vanId,
          van_label: vanLabel.trim(),
          van_color: vanColor,
        });
      }

      // Upsert pickup route (idempotent on van+direction).
      if (pickupTimes) {
        await updateRoute.mutateAsync({
          van_id: vanId,
          direction: 'pickup',
          pickup_start: pickupTimes.start,
          arrival_time: pickupTimes.end,
        });
      }
      if (dropoffTimes) {
        await updateRoute.mutateAsync({
          van_id: vanId,
          direction: 'dropoff',
          pickup_start: dropoffTimes.start,
          arrival_time: dropoffTimes.end,
        });
      }

      onDone();
    } catch (e) {
      Alert.alert('Erro ao salvar', (e as Error).message);
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
          <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">EDITAR</Text>
          <Text className="text-[26px] font-bold text-ink tracking-[-0.6px] mt-[6px] leading-[30px]">
            Van {van.van_label}
          </Text>
          <Text className="text-sm text-ink-muted mt-[6px] leading-[20px]">
            {van.school?.name}
            {van.school?.city ? ` · ${van.school.city}` : ''}
          </Text>
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

        <View className="mt-6">
          <FieldLabel>Placa / etiqueta da van</FieldLabel>
          <TextField
            value={vanLabel}
            onChangeText={(t) => {
              setVanLabel(t);
              if (error) setError(null);
            }}
            autoCapitalize="characters"
          />
        </View>

        <View className="mt-[14px]">
          <FieldLabel>Cor da van</FieldLabel>
          <View className="flex-row" style={{ gap: 10 }}>
            {COLOR_OPTIONS.map((c) => {
              const on = vanColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setVanColor(c)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: c,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: on ? 3 : 0,
                    borderColor: theme.text,
                  }}
                >
                  {on && <Icon name="check" size={18} color="#fff" />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <DirectionBlock
          label="Embarque · pra escola"
          active={hasPickup}
          onToggle={() => setHasPickup((v) => !v)}
          start={pickupStart}
          end={pickupEnd}
          onStart={setPickupStart}
          onEnd={setPickupEnd}
        />
        <DirectionBlock
          label="Desembarque · pra casa"
          active={hasDropoff}
          onToggle={() => setHasDropoff((v) => !v)}
          start={dropoffStart}
          end={dropoffEnd}
          onStart={setDropoffStart}
          onEnd={setDropoffEnd}
        />

        <View className="mt-[22px]">
          <Text className="text-[11px] font-bold text-ink-muted uppercase tracking-[0.6px] mb-2">
            Estudantes nesta van ({kids.length})
          </Text>
          <View className="bg-surface rounded-[18px] border border-line overflow-hidden">
            {kids.length === 0 ? (
              <View className="py-4 px-[14px]">
                <Text className="text-[13px] text-ink-muted">
                  Nenhum estudante vinculado ainda. Gere um código de convite na tela Minhas vans
                  e compartilhe com os pais, ou adicione um estudante não-cadastrado abaixo.
                </Text>
              </View>
            ) : (
              kids.map((k, i) => (
                <View
                  key={k.id}
                  className="flex-row gap-3 items-center py-3 px-[14px]"
                  style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
                >
                  <Avatar
                    name={k.short_name ?? k.full_name}
                    size={36}
                    bg={k.color ?? '#888'}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
                      <Text className="text-[14px] font-bold text-ink">{k.full_name}</Text>
                      {k.unregistered && (
                        <View
                          className="py-[2px] px-2 rounded-full"
                          style={{ backgroundColor: `${theme.warm}1A` }}
                        >
                          <Text
                            className="text-[9px] font-bold tracking-[0.3px]"
                            style={{ color: theme.warm }}
                          >
                            NÃO CADASTRADA
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[11px] text-ink-muted mt-[1px]">
                      {[k.grade != null ? `${k.grade}º ano` : null, k.parent_name]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {k.pickup_address && (
                      <Text className="text-[11px] text-ink-faint mt-[1px]" numberOfLines={1}>
                        {k.pickup_address}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          <Pressable
            onPress={() => onAddUnregistered(vanId)}
            className="mt-[10px] py-[12px] rounded-xl items-center"
            style={{ backgroundColor: `${theme.warm}1A` }}
          >
            <Text className="text-[13px] font-bold" style={{ color: theme.warm }}>
              + Adicionar estudante não cadastrado
            </Text>
          </Pressable>
        </View>

        <View className="flex-1" />

        <PressScale
          onPress={handleSave}
          disabled={busy}
          style={{
            marginTop: 24,
            padding: 14,
            backgroundColor: theme.text,
            borderRadius: 16,
            alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text className="text-canvas text-[15px] font-bold tracking-[-0.2px]">
            {busy ? 'Salvando…' : 'Salvar alterações'}
          </Text>
        </PressScale>
      </ScrollView>
    </View>
  );
}

function DirectionBlock({
  label,
  active,
  onToggle,
  start,
  end,
  onStart,
  onEnd,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  return (
    <View
      className="mt-[14px] p-3 rounded-2xl"
      style={{
        backgroundColor: active ? `${theme.warm}10` : theme.surface,
        borderWidth: 1,
        borderColor: active ? `${theme.warm}55` : theme.line,
      }}
    >
      <Pressable onPress={onToggle} className="flex-row items-center" style={{ gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 22,
            borderRadius: 11,
            backgroundColor: active ? theme.warm : theme.lineStrong,
            justifyContent: 'center',
            paddingHorizontal: 2,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#fff',
              alignSelf: active ? 'flex-end' : 'flex-start',
            }}
          />
        </View>
        <Text className="flex-1 text-[14px] font-bold text-ink">{label}</Text>
      </Pressable>
      {active && (
        <View className="mt-3 flex-row" style={{ gap: 10 }}>
          <View className="flex-1">
            <View className="flex-row items-baseline" style={{ gap: 6 }}>
              <FieldLabel>Início</FieldLabel>
              <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">(HH:MM)</Text>
            </View>
            <TextField
              placeholder="07:30"
              value={start}
              onChangeText={onStart}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-baseline" style={{ gap: 6 }}>
              <FieldLabel>Chegada</FieldLabel>
              <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">(HH:MM)</Text>
            </View>
            <TextField
              placeholder="08:15"
              value={end}
              onChangeText={onEnd}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        </View>
      )}
    </View>
  );
}
