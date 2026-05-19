import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';
import { PressScale } from '../components/PressScale';
import { FieldLabel, TextField } from './LoginScreen';
import { useCreateKid } from '../lib/kids';

type Props = {
  onBack: () => void;
  /** Called with the new kid's id after a successful insert. */
  onCreated: (kidId: string) => void;
};

// Five preset avatar colors drawn from the design palette.
const COLOR_OPTIONS = [
  '#E08A2A',
  '#3A5BD9',
  '#1F7A4E',
  '#9F5BC0',
  '#D04F3C',
] as const;

export function AddKidScreen({ onBack, onCreated }: Props) {
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [grade, setGrade] = useState<string>('');
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateKid();
  const busy = create.isPending;

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);
    if (!fullName.trim()) {
      setError('Informe o nome completo.');
      return;
    }
    const gradeInt = grade ? parseInt(grade, 10) : null;
    if (grade && (Number.isNaN(gradeInt) || gradeInt! < 1 || gradeInt! > 12)) {
      setError('Série inválida. Use um número de 1 a 12.');
      return;
    }
    if (!pickupAddress.trim()) {
      setError('Informe o endereço de embarque.');
      return;
    }
    try {
      const kid = await create.mutateAsync({
        full_name: fullName,
        short_name: shortName || fullName.split(' ')[0],
        grade: gradeInt,
        color,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress.trim() || null,
      });
      onCreated(kid.id);
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
          <Text className="text-[28px] font-bold text-ink tracking-[-0.6px] leading-[31px]">
            Adicionar estudante
          </Text>
          <Text className="text-sm text-ink-muted mt-2 leading-[20px]">
            Preencha as informações do estudante. Você poderá vincular a uma van depois usando um
            código de convite.
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
          <FieldLabel>Nome completo</FieldLabel>
          <TextField
            placeholder="Ex.: Ezra Vance"
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              if (error) setError(null);
            }}
          />
        </View>

        <View className="mt-[12px]">
          <View className="flex-row items-baseline" style={{ gap: 6 }}>
            <FieldLabel>Apelido</FieldLabel>
            <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">(opcional)</Text>
          </View>
          <TextField placeholder="Como costumam chamar" value={shortName} onChangeText={setShortName} />
        </View>

        <View className="mt-[12px]">
          <View className="flex-row items-baseline" style={{ gap: 6 }}>
            <FieldLabel>Série</FieldLabel>
            <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">(opcional)</Text>
          </View>
          <TextField
            placeholder="Ex.: 3"
            value={grade}
            onChangeText={setGrade}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <View className="mt-[14px]">
          <FieldLabel>Cor do avatar</FieldLabel>
          <View className="flex-row" style={{ gap: 10 }}>
            {COLOR_OPTIONS.map((c) => {
              const on = color === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
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

        <View className="mt-4">
          <FieldLabel>Endereço de embarque</FieldLabel>
          <TextField
            placeholder="Ex.: R. Cedro, 207, Apto 12"
            value={pickupAddress}
            onChangeText={(t) => {
              setPickupAddress(t);
              if (error) setError(null);
            }}
          />
        </View>

        <View className="mt-[12px]">
          <View className="flex-row items-baseline" style={{ gap: 6 }}>
            <FieldLabel>Endereço de desembarque</FieldLabel>
            <Text className="text-[11px] font-medium text-ink-faint mb-[6px]">
              (opcional · padrão: igual ao de embarque)
            </Text>
          </View>
          <TextField
            placeholder="Ex.: R. da Avó, 12"
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
          />
        </View>

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
            {busy ? 'Salvando…' : 'Adicionar estudante'}
          </Text>
        </PressScale>
      </ScrollView>
    </View>
  );
}
