import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../theme';
import { Icon } from '../../components/Icon';
import { PressScale } from '../../components/PressScale';
import { FieldLabel, TextField } from '../LoginScreen';
import { useAddUnregisteredKid } from '../../lib/driver';

type Props = {
  vanId: string;
  onBack: () => void;
  onCreated: () => void;
};

export function AddUnregisteredKidScreen({ vanId, onBack, onCreated }: Props) {
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const add = useAddUnregisteredKid();
  const busy = add.isPending;

  const handleSubmit = async () => {
    if (busy) return;
    setError(null);
    if (!fullName.trim()) return setError('Informe o nome da criança.');
    if (!pickupAddress.trim()) return setError('Informe o endereço de embarque.');
    try {
      await add.mutateAsync({
        van_id: vanId,
        full_name: fullName,
        short_name: shortName.trim() || null,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress.trim() || null,
      });
      onCreated();
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
          <Text className="text-[11px] font-bold text-warm tracking-[1.2px]">
            CRIANÇA NÃO CADASTRADA
          </Text>
          <Text className="text-[26px] font-bold text-ink tracking-[-0.6px] mt-[6px] leading-[30px]">
            Adicionar criança
          </Text>
          <Text className="text-sm text-ink-muted mt-[6px] leading-[20px]">
            Use para crianças cujos responsáveis ainda não usam o Trackly. Elas aparecem só pra
            você (motorista) — nenhum pai vê.
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
            placeholder="Ex.: Leonardo Silva"
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
          <FieldLabel>Endereço de embarque</FieldLabel>
          <TextField
            placeholder="Ex.: R. Maple, 88, Apto 12"
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
            {busy ? 'Adicionando…' : 'Adicionar criança'}
          </Text>
        </PressScale>
      </ScrollView>
    </View>
  );
}
