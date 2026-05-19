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
import { AddKidScreen } from './src/screens/AddKidScreen';
import { PickKidForVanScreen } from './src/screens/PickKidForVanScreen';
import type { ValidatedInvite } from './src/lib/invite';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { DriverRouteScreen } from './src/screens/driver/DriverRouteScreen';
import { DriverCheckinScreen } from './src/screens/driver/DriverCheckinScreen';
import { DriverProfileScreen } from './src/screens/driver/DriverProfileScreen';
import { CreateVanScreen } from './src/screens/driver/CreateVanScreen';
import { MyVansScreen } from './src/screens/driver/MyVansScreen';
import { EditVanScreen } from './src/screens/driver/EditVanScreen';
import { AddUnregisteredKidScreen } from './src/screens/driver/AddUnregisteredKidScreen';
import { TabBar } from './src/components/TabBar';
import { DriverTabBar } from './src/components/DriverTabBar';
import { FadeIn } from './src/components/FadeIn';
import { AuthProvider, useAuth } from './src/lib/auth';
import { useProfile } from './src/lib/profile';
import { queryClient, asyncStoragePersister } from './src/lib/queryClient';
import { theme } from './src/theme';

type Flow =
  | 'welcome'
  | 'login'
  | 'register'
  | 'forgot'
  | 'invite'              // anonymous (from Welcome) — validates a code before signup
  | 'inviteFromProfile'   // authenticated — full validate + pick + link flow
  | 'pickKidForVan'     // post-validate: pick which of the parent's kids to attach
  | 'addKid'              // standalone "add a kid" form
  | 'parent'
  | 'driver'
  | 'myVans'            // driver: list + manage routes/codes
  | 'createVan'         // driver: form to add a new van
  | 'editVan'           // driver: edit van + see kids on it
  | 'addUnregisteredKid'; // driver: form to add a kid whose parent isn't in the app

function Root() {
  const { session, loading, recoveryMode } = useAuth();
  const { data: profile } = useProfile();
  const [flow, setFlow] = useState<Flow>('welcome');
  const [parentTab, setParentTab] = useState('track');
  const [driverTab, setDriverTab] = useState('route');
  const [keyboardUp, setKeyboardUp] = useState(false);
  /** Code carried from the pre-signup invite flow; consumed after signup. */
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  /** Validated invite payload (route + stops) waiting on the kid picker. */
  const [pendingInvite, setPendingInvite] = useState<ValidatedInvite | null>(null);
  /** Where to return after AddKid (the picker, the profile, etc.). */
  const [addKidReturn, setAddKidReturn] = useState<Flow>('parent');
  /** Trip the driver just started; carried Rota → Check-in. */
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  /** Where to return after CreateVan (driver Rota tab, or MyVans list). */
  const [createVanReturn, setCreateVanReturn] = useState<Flow>('myVans');
  /** Which van is being edited. */
  const [editingVanId, setEditingVanId] = useState<string | null>(null);
  /** Van id the driver is adding an unregistered kid to. */
  const [addUnregisteredVanId, setAddUnregisteredVanId] = useState<string | null>(null);

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

  // When auth state changes, route based on profile role:
  //   driver → driver flow; everyone else → parent flow.
  // The "Modo motorista (demo)" link still lets unauth'd users peek at the
  // driver flow with the mocked tabs.
  useEffect(() => {
    if (loading) return;
    if (!session) {
      setFlow('welcome');
      return;
    }
    const target: Flow = profile?.role === 'driver' ? 'driver' : 'parent';
    setFlow((f) => {
      // Don't yank the user out of mid-flow side screens (myVans, createVan, etc.).
      const sideScreens: Flow[] = [
        'addKid',
        'pickKidForVan',
        'inviteFromProfile',
        'myVans',
        'createVan',
      ];
      if (sideScreens.includes(f)) return f;
      return target;
    });
  }, [session, loading, profile?.role]);

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
            onSubmit={() => {
              // If they came in via Welcome → Invite → Register, drop them into the
              // kid picker now that they have a session. Otherwise → parent flow.
              if (pendingInvite && pendingInviteCode) {
                setFlow('pickKidForVan');
              } else {
                setFlow('parent');
              }
            }}
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
            onContinue={(code, invite) => {
              setPendingInviteCode(code);
              setPendingInvite(invite);
              setFlow('register');
            }}
          />
        </FadeIn>
      )}
      {flow === 'inviteFromProfile' && (
        <FadeIn key="inviteFromProfile">
          <InviteCodeScreen
            onBack={() => setFlow('parent')}
            onContinue={(code, invite) => {
              setPendingInviteCode(code);
              setPendingInvite(invite);
              setFlow('pickKidForVan');
            }}
          />
        </FadeIn>
      )}
      {flow === 'pickKidForVan' && pendingInvite && pendingInviteCode && (
        <FadeIn key="pickKidForVan">
          <PickKidForVanScreen
            code={pendingInviteCode}
            invite={pendingInvite}
            onBack={() => {
              setPendingInvite(null);
              setPendingInviteCode(null);
              setFlow(session ? 'parent' : 'welcome');
            }}
            onAddKid={() => {
              setAddKidReturn('pickKidForVan');
              setFlow('addKid');
            }}
            onLinked={() => {
              setPendingInvite(null);
              setPendingInviteCode(null);
              setFlow('parent');
            }}
          />
        </FadeIn>
      )}
      {flow === 'addKid' && (
        <FadeIn key="addKid">
          <AddKidScreen
            onBack={() => setFlow(addKidReturn)}
            onCreated={() => setFlow(addKidReturn)}
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
              <ProfileScreen
                onLinkVan={() => setFlow('inviteFromProfile')}
                onAddKid={() => {
                  setAddKidReturn('parent');
                  setFlow('addKid');
                }}
              />
            )}
          </FadeIn>
          {!keyboardUp && <TabBar active={parentTab} onTab={setParentTab} />}
        </>
      )}
      {flow === 'driver' && (
        <>
          <FadeIn key={`driver-${driverTab}`} translate={6} duration={180}>
            {driverTab === 'route' && (
              <DriverRouteScreen
                onOpenCheckin={(tripId) => {
                  setSelectedTripId(tripId);
                  setDriverTab('checkin');
                }}
                onCreate={() => {
                  setCreateVanReturn('driver');
                  setFlow('createVan');
                }}
              />
            )}
            {driverTab === 'checkin' && (
              <DriverCheckinScreen
                selectedTripId={selectedTripId}
                onSelectedTripCleared={() => {
                  setSelectedTripId(null);
                  setDriverTab('route');
                }}
              />
            )}
            {driverTab === 'profile' && (
              <DriverProfileScreen onOpenRoutes={() => setFlow('myVans')} />
            )}
          </FadeIn>
          {!keyboardUp && <DriverTabBar active={driverTab} onTab={setDriverTab} />}
        </>
      )}
      {flow === 'myVans' && (
        <FadeIn key="myVans">
          <MyVansScreen
            onBack={() => setFlow('driver')}
            onCreate={() => {
              setCreateVanReturn('myVans');
              setFlow('createVan');
            }}
            onEdit={(vanId) => {
              setEditingVanId(vanId);
              setFlow('editVan');
            }}
          />
        </FadeIn>
      )}
      {flow === 'createVan' && (
        <FadeIn key="createVan">
          <CreateVanScreen
            onBack={() => setFlow(createVanReturn)}
            onCreated={() => setFlow(createVanReturn)}
          />
        </FadeIn>
      )}
      {flow === 'editVan' && editingVanId && (
        <FadeIn key={`editVan-${editingVanId}`}>
          <EditVanScreen
            vanId={editingVanId}
            onBack={() => {
              setEditingVanId(null);
              setFlow('myVans');
            }}
            onDone={() => {
              setEditingVanId(null);
              setFlow('myVans');
            }}
            onAddUnregistered={(vanId) => {
              setAddUnregisteredVanId(vanId);
              setFlow('addUnregisteredKid');
            }}
          />
        </FadeIn>
      )}
      {flow === 'addUnregisteredKid' && addUnregisteredVanId && (
        <FadeIn key={`addUnregistered-${addUnregisteredVanId}`}>
          <AddUnregisteredKidScreen
            vanId={addUnregisteredVanId}
            onBack={() => {
              setAddUnregisteredVanId(null);
              setFlow('editVan');
            }}
            onCreated={() => {
              setAddUnregisteredVanId(null);
              setFlow('editVan');
            }}
          />
        </FadeIn>
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
