import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/Icon';
import { PressScale } from '../../components/PressScale';
import { FieldLabel, TextField } from '../LoginScreen';
import { useCreateVan } from '../../lib/driver';

type Props = {
  onBack: () => void;
  onCreated: (vanId: string) => void;
};

const COLOR_OPTIONS = ['#5B7A9F', '#3A5BD9', '#1F7A4E', '#9F5BC0', '#D04F3C'] as const;
const TIME_RE = /^([0-1]?\d|2[0-3]):[0-5]\d$/;

function normalizeTime(t: string): string | null | 'invalid' {
  const trimmed = t.trim();
  if (!trimmed) return null;
  if (!TIME_RE.test(trimmed)) return 'invalid';
  const [h, m] = trimmed.split(':');
  return `${(h ?? '00').padStart(2, '0')}:${m ?? '00'}:00`;
}

export function CreateVanScreen({ onBack, onCreated }: Props) {
  const [schoolName, setSchoolName] = useState('');
  const [schoolCity, setSchoolCity] = useState('');
  const [vanLabel, setVanLabel] = useState('');
  const [vanColor, setVanColor] = useState<string>(COLOR_OPTIONS[0]);
  const [hasPickup, setHasPickup] = useState(true);
  const [pickupStart, setPickupStart] = useState('07:30');
  const [pickupEnd, setPickupEnd] = useState('08:15');
  const [hasDropoff, setHasDropoff] = useState(false);
  const [dropoffStart, setDropoffStart] = useState('17:30');
  const [dropoffEnd, setDropoffEnd] = useState('18:15');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateVan();
  const busy = create.isPending;

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);
    if (!schoolName.trim()) return setError('Informe o nome da escola.');
    if (!vanLabel.trim()) return setError('Informe a placa ou etiqueta da van.');
    if (!hasPickup && !hasDropoff)
      return setError('Selecione ao menos uma direção (embarque ou desembarque).');

    let pickup: { pickup_start: string | null; arrival_time: string | null } | null = null;
    if (hasPickup) {
      const a = normalizeTime(pickupStart);
      const b = normalizeTime(pickupEnd);
      if (a === 'invalid' || b === 'invalid')
        return setError('Horários de embarque inválidos. Use HH:MM.');
      pickup = { pickup_start: a, arrival_time: b };
    }
    let dropoff: { pickup_start: string | null; arrival_time: string | null } | null = null;
    if (hasDropoff) {
      const a = normalizeTime(dropoffStart);
      const b = normalizeTime(dropoffEnd);
      if (a === 'invalid' || b === 'invalid')
        return setError('Horários de desembarque inválidos. Use HH:MM.');
      dropoff = { pickup_start: a, arrival_time: b };
    }

    try {
      const { vanId } = await create.mutateAsync({
        school_name: schoolName,
        school_city: schoolCity.trim() || null,
        van_label: vanLabel,
        van_color: vanColor,
        pickup,
        dropoff,
      });
      onCreated(vanId);
    } catch (e) {
      setError((e as Error).message);
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
          <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">NOVA VAN</Text>
          <Text className="text-[26px] font-bold text-ink tracking-[-0.6px] mt-[6px] leading-[30px]">
            Criar van
          </Text>
          <Text className="text-sm text-ink-muted mt-[6px] leading-[20px]">
            Cadastre a escola, a van e as direções que ela faz. Um único código de convite cobre
            ambas as direções pro pai.
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
          <FieldLabel>Escola</FieldLabel>
          <TextField
            placeholder="Ex.: Colégio Greenfield"
            value={schoolName}
            onChangeText={(t) => {
              setSchoolName(t);
              if (error) setError(null);
            }}
          />
        </View>

        <View className="mt-[12px]">
          <View className="flex-row items-baseline" style={{ gap: 6 }}>
            <FieldLabel>Cidade</FieldLabel>
            <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">(opcional)</Text>
          </View>
          <TextField placeholder="Ex.: São Paulo" value={schoolCity} onChangeText={setSchoolCity} />
        </View>

        <View className="mt-[12px]">
          <FieldLabel>Placa / etiqueta da van</FieldLabel>
          <TextField
            placeholder="Ex.: VK-32"
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

        <View className="flex-1" />

        <PressScale
          onPress={handleSubmit}
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
            {busy ? 'Criando…' : 'Criar van'}
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
