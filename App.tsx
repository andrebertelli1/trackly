import './global.css';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { RoleScreen } from './src/screens/RoleScreen';
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

type Flow = 'welcome' | 'role' | 'parent' | 'driver';

export default function App() {
  const [flow, setFlow] = useState<Flow>('welcome');
  const [parentTab, setParentTab] = useState('track');
  const [driverTab, setDriverTab] = useState('route');

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        {flow === 'welcome' && <WelcomeScreen onContinue={() => setFlow('role')} />}
        {flow === 'role' && (
          <RoleScreen
            onBack={() => setFlow('welcome')}
            onPick={(role) => setFlow(role === 'driver' ? 'driver' : 'parent')}
          />
        )}
        {flow === 'parent' && (
          <>
            <View className="flex-1">
              {parentTab === 'track' && <TrackingScreen />}
              {parentTab === 'schedule' && <ScheduleScreen />}
              {parentTab === 'history' && <HistoryScreen />}
              {parentTab === 'chat' && <ChatScreen />}
              {parentTab === 'profile' && <ProfileScreen />}
            </View>
            <TabBar active={parentTab} onTab={setParentTab} />
          </>
        )}
        {flow === 'driver' && (
          <>
            <View className="flex-1">
              {driverTab === 'route' && <DriverRouteScreen />}
              {driverTab === 'checkin' && <DriverCheckinScreen />}
              {driverTab === 'profile' && <DriverProfileScreen />}
            </View>
            <DriverTabBar active={driverTab} onTab={setDriverTab} />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
