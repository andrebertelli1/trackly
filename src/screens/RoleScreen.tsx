import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '../theme';
import { Icon } from '../components/Icon';

type Props = {
  onBack: () => void;
  onPick: (role: 'parent' | 'driver') => void;
};

export function RoleScreen({ onBack, onPick }: Props) {
  return (
    <View className="flex-1 bg-canvas">
      <View className="px-6 pt-1">
        <Pressable onPress={onBack} hitSlop={10}>
          <Icon name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <Text className="mt-[14px] text-[28px] font-bold text-ink tracking-[-0.6px] leading-[31px]">
          Quem está se cadastrando?
        </Text>
        <Text className="mt-2 text-sm text-ink-muted leading-5">
          Você pode trocar de função a qualquer momento. Motoristas precisam de um código verificado
          da escola.
        </Text>
      </View>

      <View className="flex-1 p-6 gap-[14px]">
        <RoleCard
          title="Sou responsável"
          desc="Acompanhe a van do seu filho, receba alertas de embarque/desembarque e converse com o motorista."
          pillText="MAIS COMUM"
          tone={theme.base}
          bg={`${theme.base}10`}
          icon="user"
          primary
          onPress={() => onPick('parent')}
        />
        <RoleCard
          title="Sou motorista"
          desc="Conduza sua rota, faça check-in/check-out das crianças e compartilhe localização ao vivo."
          pillText="MOTORISTA VERIFICADO"
          tone={theme.warm}
          bg={`${theme.warm}10`}
          icon="car"
          onPress={() => onPick('driver')}
        />
        <View className="flex-1" />
        <View className="flex-row items-center gap-2">
          <Icon name="shield" size={14} color={theme.success} />
          <Text className="flex-1 text-[11px] text-ink-muted">
            Localização criptografada de ponta a ponta. Nunca compartilhamos dados com terceiros.
          </Text>
        </View>
      </View>
    </View>
  );
}

function RoleCard({
  title,
  desc,
  pillText,
  tone,
  bg,
  icon,
  primary,
  onPress,
}: {
  title: string;
  desc: string;
  pillText: string;
  tone: string;
  bg: string;
  icon: 'user' | 'car';
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-[14px] items-start p-[18px] rounded-[20px] bg-surface"
      style={{
        borderWidth: primary ? 2 : 1,
        borderColor: primary ? tone : 'rgba(20,16,10,0.08)',
        shadowColor: tone,
        shadowOpacity: primary ? 0.13 : 0,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: primary ? 3 : 0,
      }}
    >
      <View
        className="w-12 h-12 rounded-[14px] items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <Icon name={icon} size={24} color={tone} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-ink tracking-[-0.3px]">{title}</Text>
          <View className="py-[2px] px-[7px] rounded-full" style={{ backgroundColor: bg }}>
            <Text className="text-[9px] font-bold tracking-[0.3px]" style={{ color: tone }}>
              {pillText}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-ink-muted mt-[6px] leading-[17px]">{desc}</Text>
      </View>
      <Icon name="chevron" size={16} color={theme.textFaint} />
    </Pressable>
  );
}
