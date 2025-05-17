import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import LoadingScreen from '@/components/LoadingScreen';
import { AppProvider } from '@/contexts/AppProvider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeFirebaseSchemas } from '@/services/firebase/schemas';

function RootLayoutNav() {
  const { user, isCleaner } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/(tabs)' as any);
    } else if (isCleaner) {
      router.replace('/(cleaner)' as any);
    } else {
      router.replace('/(user)' as any);
    }
  }, [user, isCleaner]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(cleaner)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const init = async () => {
      try {
        await initializeFirebaseSchemas();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
      }
    };
    init();
  }, []);

  if (!loaded || !isInitialized) {
    return <LoadingScreen message={initError || "Инициализация приложения..."} />;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AppProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
