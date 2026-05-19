import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { theme } from '../theme';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { useAuth } from '../lib/auth';
import { useProfile } from '../lib/profile';
import { useMyKids } from '../lib/kids';

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

type Props = { onLinkVan?: () => void; onAddKid?: () => void };

export function ProfileScreen({ onLinkVan, onAddKid }: Props = {}) {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: kids = [] } = useMyKids();
  const displayName = profile?.full_name || user?.email || 'Sua conta';
  const displayPhone = profile?.phone || user?.email || '';

  // De-duplicate kids that appear once per route (morning + afternoon).
  const uniqueKids = Array.from(
    new Map(kids.map((k) => [k.id, k])).values(),
  );
  const linkedVans = new Set(
    kids.map((k) => k.route?.van_label).filter((v): v is string => !!v),
  );
  const firstVan = [...linkedVans][0] ?? null;
  const firstDriver = kids.find((k) => k.route?.driver_name)?.route?.driver_name ?? null;

  const [signingOut, setSigningOut] = React.useState(false);
  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.warn('[signOut]', e);
      Alert.alert('Erro ao sair', (e as Error).message);
      setSigningOut(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="px-5 pt-1 pb-4">
        <Text className="text-[22px] font-bold text-ink tracking-[-0.5px]">Perfil</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <View className="bg-surface rounded-[20px] p-4 border border-line flex-row gap-[14px] items-center">
          <Avatar name={displayName} size={56} bg="#9F5BC0" />
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-ink">{displayName}</Text>
            <Text className="text-xs text-ink-muted mt-[1px]">{displayPhone}</Text>
            <View className="flex-row gap-[6px] mt-[6px]">
              <TagPill text="VERIFICADA" tone="success" />
              {uniqueKids.length > 0 && (
                <TagPill
                  text={`${uniqueKids.length} ${uniqueKids.length === 1 ? 'ESTUDANTE' : 'ESTUDANTES'}`}
                  tone="muted"
                />
              )}
            </View>
          </View>
          <Pressable className="py-[7px] px-3 rounded-[10px] bg-surface-alt">
            <Text className="text-ink text-xs font-semibold">Editar</Text>
          </Pressable>
        </View>

        <SectionLabel title="Estudantes" right="Adicionar" onRightPress={onAddKid} />
        <View className="bg-surface rounded-[18px] border border-line overflow-hidden">
          {uniqueKids.length === 0 ? (
            <View className="py-4 px-[14px]">
              <Text className="text-[13px] text-ink-muted">
                Nenhum estudante vinculado ainda. Use um código de convite abaixo para conectar.
              </Text>
            </View>
          ) : (
            uniqueKids.map((k, i) => {
              const displayShort = k.short_name ?? k.full_name;
              const detail = [
                k.grade != null ? `${k.grade}º ano` : null,
                k.route?.school?.name,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <View
                  key={k.id}
                  className="flex-row gap-3 items-center py-3 px-[14px]"
                  style={{ borderTopWidth: i ? 1 : 0, borderTopColor: theme.line }}
                >
                  <Avatar name={displayShort} size={40} bg={k.color ?? '#888'} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-ink">{k.full_name}</Text>
                    {detail.length > 0 && (
                      <Text className="text-[11px] text-ink-muted mt-[1px]">{detail}</Text>
                    )}
                    {k.pickup_address && (
                      <Text className="text-[11px] text-ink-faint mt-[1px]" numberOfLines={1}>
                        {k.pickup_address}
                      </Text>
                    )}
                  </View>
                  {k.route?.van_label && (
                    <TagPill text={`VAN ${k.route.van_label}`} tone="base" />
                  )}
                </View>
              );
            })
          )}
        </View>

        <SectionLabel title="Vincular nova van" />
        <Pressable
          onPress={onLinkVan}
          className="w-full bg-surface flex-row items-center"
          style={{
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.lineStrong,
            gap: 14,
          }}
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
              Inserir código de convite
            </Text>
            <Text className="text-[11px] text-ink-muted mt-[2px] leading-[15px]">
              Conecte sua conta à van e ao motorista da escola.
            </Text>
          </View>
          <Icon name="chevron" size={16} color={theme.textFaint} />
        </Pressable>

        <View
          className="mt-2 flex-row items-center bg-surface-alt"
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 14,
            gap: 10,
          }}
        >
          <Icon name="check" size={14} color={theme.success} />
          <Text className="flex-1 text-[11px] text-ink-muted">
            {linkedVans.size === 0 ? (
              <>Nenhuma van vinculada ainda.</>
            ) : (
              <>
                <Text className="font-semibold text-ink">
                  {linkedVans.size === 1
                    ? '1 van vinculada'
                    : `${linkedVans.size} vans vinculadas`}
                </Text>
                {firstVan ? ` · ${firstVan}` : ''}
                {firstDriver ? ` · Motorista ${firstDriver}` : ''}
              </>
            )}
          </Text>
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

        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          hitSlop={8}
          className="mt-[18px] p-[14px] rounded-2xl items-center"
          style={{ backgroundColor: `${theme.danger}18`, opacity: signingOut ? 0.6 : 1 }}
        >
          <Text className="text-[14px] font-bold" style={{ color: theme.danger }}>
            {signingOut ? 'Saindo…' : 'Sair da conta'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionLabel({
  title,
  right,
  onRightPress,
}: {
  title: string;
  right?: string;
  onRightPress?: () => void;
}) {
  return (
    <View className="flex-row justify-between items-baseline mt-[18px] mb-2 mx-[6px]">
      <Text className="text-[11px] text-ink-muted font-bold uppercase tracking-[0.6px]">{title}</Text>
      {right &&
        (onRightPress ? (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Text className="text-brand text-xs font-semibold">{right}</Text>
          </Pressable>
        ) : (
          <Text className="text-brand text-xs font-semibold">{right}</Text>
        ))}
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
