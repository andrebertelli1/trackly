import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { theme } from '../theme';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { FadeIn } from '../components/FadeIn';
import { PressScale } from '../components/PressScale';
import { DRIVER } from '../data';

type Msg = { who: 'me' | 'driver'; text: string; time: string; tag?: string };

const INITIAL: Msg[] = [
  { who: 'driver', text: 'Bom dia! Indo para sua parada agora. ~8 min', time: '8:04' },
  { who: 'me', text: 'Ótimo — Ezra já está na porta 👍', time: '8:05' },
  { who: 'driver', text: 'Aviso: pequeno desvio na R. Bétula, +2 min', time: '8:06', tag: 'AVISO DE ROTA' },
  { who: 'me', text: 'Sem problema, obrigada por avisar!', time: '8:07' },
  { who: 'driver', text: 'Peguei a Maya. A caminho de vocês agora.', time: '8:09' },
];

const QUICK = ['Vou me atrasar', 'Já na porta', 'Pular hoje', 'Obrigada!'];

type Props = { onBack?: () => void };

export function ChatScreen({ onBack }: Props = {}) {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState<Msg[]>(INITIAL);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { who: 'me', text: t, time: 'agora' }]);
    setMsg('');
  };

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-5 pt-1 pb-[14px] bg-surface border-b border-line">
        <Pressable onPress={onBack} hitSlop={10}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <Avatar name={DRIVER.name} size={36} bg={DRIVER.color} />
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink">{DRIVER.name}</Text>
          <View className="flex-row items-center gap-[5px] mt-[1px]">
            <View className="w-[6px] h-[6px] rounded-full bg-success" />
            <Text className="text-[11px] text-success font-semibold">
              Dirigindo · 8 min até Ezra
            </Text>
          </View>
        </View>
        <View
          className="w-[34px] h-[34px] rounded-full items-center justify-center"
          style={{ backgroundColor: `${theme.success}22` }}
        >
          <Icon name="phone" size={15} color={theme.success} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 6 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="self-center py-1 px-[10px] bg-surface-alt rounded-[10px] mb-[6px]">
          <Text className="text-[10px] text-ink-muted font-semibold tracking-[0.5px]">
            HOJE · VIAGEM DA MANHÃ
          </Text>
        </View>

        {messages.map((m, i) => (
          <FadeIn key={i} duration={180} translate={6} style={{ flex: 0 }}>
            <Bubble m={m} />
          </FadeIn>
        ))}

        <View className="mt-2 flex-row flex-wrap gap-[6px]">
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => send(q)}
              className="py-[7px] px-3 rounded-full bg-surface border border-line"
            >
              <Text className="text-ink text-xs font-semibold">{q}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-2 px-4 pt-[10px] pb-[14px] bg-surface border-t border-line">
        <View className="flex-1 px-[14px] py-[9px] bg-surface-alt rounded-[22px]">
          <TextInput
            value={msg}
            onChangeText={setMsg}
            onSubmitEditing={() => send(msg)}
            placeholder="Mensagem para Marcus"
            placeholderTextColor={theme.textFaint}
            className="text-sm text-ink p-0"
            returnKeyType="send"
          />
        </View>
        <PressScale
          onPress={() => send(msg)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.base,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-white text-lg font-bold -mt-[2px]">→</Text>
        </PressScale>
      </View>
    </View>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isMe = m.who === 'me';
  return (
    <View className={isMe ? 'items-end' : 'items-start'}>
      <View className="max-w-[76%]">
        {m.tag && (
          <Text
            className="text-[9px] font-bold text-warm tracking-[0.6px] mb-[2px] px-1"
            style={{ textAlign: isMe ? 'right' : 'left' }}
          >
            {m.tag}
          </Text>
        )}
        <View
          className="py-[9px] px-[13px] rounded-[18px]"
          style={{
            backgroundColor: isMe ? theme.base : theme.surface,
            borderBottomRightRadius: isMe ? 6 : 18,
            borderBottomLeftRadius: isMe ? 18 : 6,
            borderWidth: isMe ? 0 : 1,
            borderColor: theme.line,
          }}
        >
          <Text
            className="text-sm leading-[19px]"
            style={{ color: isMe ? '#fff' : theme.text }}
          >
            {m.text}
          </Text>
        </View>
        <Text
          className="text-[10px] text-ink-faint mt-[3px] px-1"
          style={{ textAlign: isMe ? 'right' : 'left' }}
        >
          {m.time}
        </Text>
      </View>
    </View>
  );
}
