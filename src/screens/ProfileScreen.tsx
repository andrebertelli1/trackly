import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { KIDS } from '../data';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';

type PrefIcon = 'bell' | 'shield' | 'phone' | 'user';

const CONTACTS = [
  { n: 'David Vance', r: 'Cônjuge', c: '#2A6FDB' },
  { n: 'Vovó Lu', r: 'Embarque autorizado', c: '#D97757' },
];

const PREFS: { icon: PrefIcon; label: string; detail?: string }[] = [
  { icon: 'bell', label: 'Notificações', detail: 'Todas as viagens' },
  { icon: 'shield', label: 'Privacidade e segurança' },
  { icon: 'phone', label: 'Contatos de emergência', detail: '2 ativos' },
  { icon: 'user', label: 'Pagamento e cobrança', detail: 'Visa ••4421' },
];

export function ProfileScreen() {
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-4">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View className="bg-surface rounded-[20px] p-4 border border-line flex-row gap-[14px] items-center">
          <Avatar name="Sara Vance" size={56} bg="#9F5BC0" />
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-ink">Sara Vance</Text>
            <Text className="text-xs text-ink-muted mt-[1px]">
              +55 11 95555 0142 · Verificada
            </Text>
            <View className="flex-row gap-[6px] mt-[6px]">
              <TagPill text="VERIFICADA" tone="success" />
              <TagPill text="3 CRIANÇAS" tone="muted" />
            </View>
          </View>
          <Pressable className="py-[7px] px-3 rounded-[10px] bg-surface-alt">
            <Text className="text-ink text-xs font-semibold">Editar</Text>
          </Pressable>
        </View>

        <SectionLabel title="Crianças" right="Adicionar" />
        <View className="bg-surface rounded-[18px] border border-line overflow-hidden">
          {KIDS.map((k, i) => (
            <View
              key={k.id}
              className="flex-row gap-3 items-center py-3 px-[14px]"
              style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
            >
              <Avatar name={k.name} size={40} bg={k.color} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink">{k.name} Vance</Text>
                <Text className="text-[11px] text-ink-muted mt-[1px]">
                  {k.grade}º ano · Escola Greenfield
                </Text>
              </View>
              <TagPill text="VAN VK-32" tone="base" />
            </View>
          ))}
        </View>

        <SectionLabel title="Contatos de confiança" />
        <View className="bg-surface rounded-[18px] border border-line overflow-hidden">
          {CONTACTS.map((p, i) => (
            <View
              key={i}
              className="flex-row items-center gap-3 py-[11px] px-[14px]"
              style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
            >
              <Avatar name={p.n} size={32} bg={p.c} />
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-ink">{p.n}</Text>
                <Text className="text-[11px] text-ink-muted mt-[1px]">{p.r}</Text>
              </View>
              <Icon name="chevron" size={14} color={theme.textFaint} />
            </View>
          ))}
        </View>

        <SectionLabel title="Preferências" />
        <View className="bg-surface rounded-[18px] border border-line overflow-hidden">
          {PREFS.map((p, i) => (
            <View
              key={p.label}
              className="flex-row items-center gap-[14px] py-3 px-[14px]"
              style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
            >
              <View className="w-[30px] h-[30px] rounded-[9px] bg-surface-alt items-center justify-center">
                <Icon name={p.icon} size={16} color={theme.text} />
              </View>
              <Text className="flex-1 text-sm text-ink font-medium">{p.label}</Text>
              {p.detail && <Text className="text-xs text-ink-muted">{p.detail}</Text>}
              <Icon name="chevron" size={14} color={theme.textFaint} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ title, right }: { title: string; right?: string }) {
  return (
    <View className="flex-row justify-between items-baseline mt-[18px] mb-2 mx-[6px]">
      <Text className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.6px]">{title}</Text>
      {right && <Text className="text-brand text-xs font-semibold">{right}</Text>}
    </View>
  );
}

function TagPill({ text, tone }: { text: string; tone: 'success' | 'muted' | 'base' }) {
  const bg =
    tone === 'success' ? `${theme.success}22` : tone === 'base' ? `${theme.base}1A` : theme.surfaceAlt;
  const fg = tone === 'success' ? theme.success : tone === 'base' ? theme.base : theme.textMuted;
  return (
    <View className="py-[2px] px-2 rounded-full" style={{ backgroundColor: bg }}>
      <Text className="text-[10px] font-bold tracking-[0.3px]" style={{ color: fg }}>
        {text}
      </Text>
    </View>
  );
}
