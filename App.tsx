import './global.css';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Keyboard, View, ActivityIndicator } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { InviteCodeScreen } from './src/screens/InviteCodeScreen';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DriverRouteScreen } from './src/screens/driver/DriverRouteScreen';
import { DriverCheckinScreen } from './src/screens/driver/DriverCheckinScreen';
import { DriverProfileScreen } from './src/screens/driver/DriverProfileScreen';
import { TabBar } from './src/components/TabBar';
import { DriverTabBar } from './src/components/DriverTabBar';
import { FadeIn } from './src/components/FadeIn';
import { AuthProvider, useAuth } from './src/lib/auth';
import { queryClient, asyncStoragePersister } from './src/lib/queryClient';
import { theme } from './src/theme';

type Flow =
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot'
  | 'invite'
  | 'inviteFromProfile'
  | 'parent'
  | 'driver';

function Root() {
  const { session, loading, recoveryMode } = useAuth();
  const [flow, setFlow] = useState<Flow>('welcome');
  const [parentTab, setParentTab] = useState('track');
  const [driverTab, setDriverTab] = useState('route');
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => setKeyboardUp(true));
    const showFallback = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardUp(false));
    const hideFallback = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => {
      show.remove();
      showFallback.remove();
      hide.remove();
      hideFallback.remove();
    };
  }, []);

  // When auth state changes, jump straight into / out of the parent flow.
  useEffect(() => {
    if (loading) return;
    if (session) setFlow((f) => (f === 'driver' ? f : 'parent'));
    else setFlow('welcome');
  }, [session, loading]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={theme.base} />
      </View>
    );
  }

  // Recovery mode preempts everything else: a user who clicked the email link
  // is in a transient "set new password" state regardless of where they were.
  if (recoveryMode) {
    return (
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FadeIn key="reset-password">
          <ResetPasswordScreen onDone={() => setFlow(session ? 'parent' : 'login')} />
        </FadeIn>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {flow === 'welcome' && (
        <FadeIn key="welcome">
          <WelcomeScreen
            onContinue={() => setFlow('login')}
            onInviteCode={() => setFlow('invite')}
          />
        </FadeIn>
      )}
      {flow === 'login' && (
        <FadeIn key="login">
          <LoginScreen
            onBack={() => setFlow('welcome')}
            onLogin={() => setFlow('parent')}
            onRegister={() => setFlow('register')}
            onForgot={() => setFlow('forgot')}
            onDriverDemo={() => setFlow('driver')}
          />
        </FadeIn>
      )}
      {flow === 'register' && (
        <FadeIn key="register">
          <RegisterScreen
            onLogin={() => setFlow('login')}
            onSubmit={() => setFlow('parent')}
          />
        </FadeIn>
      )}
      {flow === 'forgot' && (
        <FadeIn key="forgot">
          <ForgotPasswordScreen onBack={() => setFlow('login')} />
        </FadeIn>
      )}
      {flow === 'invite' && (
        <FadeIn key="invite">
          <InviteCodeScreen
            onBack={() => setFlow('welcome')}
            onContinue={() => setFlow('register')}
          />
        </FadeIn>
      )}
      {flow === 'inviteFromProfile' && (
        <FadeIn key="inviteFromProfile">
          <InviteCodeScreen
            onBack={() => setFlow('parent')}
            onContinue={() => setFlow('parent')}
          />
        </FadeIn>
      )}
      {flow === 'parent' && (
        <>
          <FadeIn key={`parent-${parentTab}`} translate={6} duration={180}>
            {parentTab === 'track' && <TrackingScreen />}
            {parentTab === 'schedule' && <ScheduleScreen />}
            {parentTab === 'history' && <HistoryScreen />}
            {parentTab === 'chat' && <ChatScreen onBack={() => setParentTab('track')} />}
            {parentTab === 'profile' && (
              <ProfileScreen onLinkVan={() => setFlow('inviteFromProfile')} />
            )}
          </FadeIn>
          {!keyboardUp && <TabBar active={parentTab} onTab={setParentTab} />}
        </>
      )}
      {flow === 'driver' && (
        <>
          <FadeIn key={`driver-${driverTab}`} translate={6} duration={180}>
            {driverTab === 'route' && <DriverRouteScreen />}
            {driverTab === 'checkin' && <DriverCheckinScreen />}
            {driverTab === 'profile' && <DriverProfileScreen />}
          </FadeIn>
          {!keyboardUp && <DriverTabBar active={driverTab} onTab={setDriverTab} />}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <AuthProvider>
        <SafeAreaProvider>
          <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
            <StatusBar style="dark" />
            <Root />
          </SafeAreaView>
        </SafeAreaProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
