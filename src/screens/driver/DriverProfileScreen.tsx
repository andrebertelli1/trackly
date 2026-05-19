import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { theme } from '../../theme';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../lib/auth';
import { useProfile } from '../../lib/profile';
import { useMyVans } from '../../lib/driver';

const CREDS = [
  { label: 'CNH comercial', value: 'D · válida até 2027' },
  { label: 'Antecedentes', value: 'Aprovado · abr 2026' },
  { label: 'Treinamento de segurança infantil', value: 'Renova ago 2026' },
  { label: 'Inspeção do veículo', value: 'VK-32 · aprovada' },
];

type Props = { onOpenRoutes?: () => void };

export function DriverProfileScreen({ onOpenRoutes }: Props = {}) {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: vans = [] } = useMyVans();
  const displayName = profile?.full_name ?? 'Motorista';
  const totalKids = vans.reduce((acc, v) => acc + v.kid_count, 0);
  const primaryVan = vans[0]?.van_label ?? null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      Alert.alert('Erro ao sair', (e as Error).message);
    }
  };
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-3">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">
          Meu perfil de motorista
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {/* hero */}
        <View
          className="p-[18px] rounded-[22px] overflow-hidden bg-brand"
          style={{
            shadowColor: theme.base,
            shadowOpacity: 0.25,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 12 },
            elevation: 6,
          }}
        >
          <View className="flex-row gap-[14px] items-center">
            <Avatar name={displayName} size={62} bg="#1A2B5A" />
            <View className="flex-1">
              <Text className="text-white text-lg font-bold tracking-[-0.3px]">{displayName}</Text>
              <Text className="text-white/85 text-xs">
                {primaryVan
                  ? `Van ${primaryVan}${vans.length > 1 ? ` · +${vans.length - 1}` : ''}`
                  : 'Nenhuma rota criada'}
              </Text>
              <View className="mt-[6px] flex-row items-center gap-[6px]">
                <Icon name="star" size={12} color={theme.warm} />
                <Text className="text-white text-[13px] font-bold">4.92</Text>
                <Text className="text-white/70 text-[11px]">· 1.284 viagens</Text>
              </View>
            </View>
          </View>
          <View className="flex-row gap-[10px] mt-[18px]">
            <KPI label="Vans" value={`${vans.length}`} sub="ativas" />
            <KPI label="Estudantes" value={`${totalKids}`} sub="vinculados" />
            <KPI label="Pontualidade" value="98%" sub="últ. 30d" />
          </View>
        </View>

        {/* Minhas rotas */}
        <Pressable
          onPress={onOpenRoutes}
          className="mt-[18px] p-[14px] rounded-[18px] bg-surface flex-row items-center"
          style={{ gap: 14, borderWidth: 1, borderColor: theme.line }}
        >
          <View
            className="items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              backgroundColor: `${theme.warm}1A`,
            }}
          >
            <Icon name="bolt" size={22} color={theme.warm} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-ink tracking-[-0.2px]">
              Minhas vans e códigos
            </Text>
            <Text className="text-[11px] text-ink-muted mt-[2px] leading-[15px]">
              {vans.length === 0
                ? 'Crie sua primeira van'
                : `${vans.length} ${vans.length === 1 ? 'van' : 'vans'} · gerar/compartilhar códigos`}
            </Text>
          </View>
          <Icon name="chevron" size={16} color={theme.textFaint} />
        </Pressable>

        <SectionLabel title="Credenciais" />
        <View className="bg-surface rounded-[18px] border border-line overflow-hidden">
          {CREDS.map((c, i) => (
            <View
              key={c.label}
              className="flex-row items-center gap-3 py-3 px-[14px]"
              style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
            >
              <View
                className="w-7 h-7 rounded-lg items-center justify-center"
                style={{ backgroundColor: `${theme.success}22` }}
              >
                <Icon name="check" size={16} color={theme.success} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-ink">{c.label}</Text>
                <Text className="text-[11px] text-ink-muted mt-[1px]">{c.value}</Text>
              </View>
              <View
                className="py-[2px] px-[7px] rounded-full"
                style={{ backgroundColor: `${theme.success}18` }}
              >
                <Text className="text-[9px] font-bold text-success tracking-[0.3px]">
                  VERIFICADO
                </Text>
              </View>
            </View>
          ))}
        </View>

        <SectionLabel title="Veículo de hoje" />
        <View className="bg-surface rounded-[18px] border border-line p-[14px] flex-row items-center gap-[14px]">
          <View
            className="w-[54px] h-[54px] rounded-[14px] items-center justify-center"
            style={{ backgroundColor: `${theme.warm}22` }}
          >
            <Icon name="car" size={28} color={theme.warm} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-ink">Van VK-32 · 14 lugares</Text>
            <Text className="text-[11px] text-ink-muted">
              Amarela · Placa KD-4291 · Última revisão 28/abr
            </Text>
          </View>
          <Pressable className="bg-surface-alt py-[7px] px-3 rounded-[10px]">
            <Text className="text-ink text-xs font-semibold">Inspecionar</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleSignOut}
          className="mt-[18px] py-[13px] rounded-[14px] items-center"
          style={{ backgroundColor: `${theme.danger}18` }}
        >
          <Text className="text-sm font-bold" style={{ color: theme.danger }}>
            Sair da conta
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function KPI({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View className="flex-1 py-[10px] px-3 rounded-xl bg-white/15">
      <Text className="text-white/75 text-[10px] font-bold uppercase tracking-[0.5px]">{label}</Text>
      <Text className="text-white text-lg font-bold tracking-[-0.4px] mt-[2px]">{value}</Text>
      <Text className="text-white/65 text-[10px]">{sub}</Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.6px] mt-[18px] mb-2 mx-[6px]">
      {title}
    </Text>
  );
}
