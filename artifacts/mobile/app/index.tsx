import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { OutlineButton, PrimaryButton, Screen } from '@/components/FinanceUi';

export default function WelcomeScreen() {
  const colors = useColors();
  const { isLoaded, isSignedIn } = useAuth();
  const { ready, data } = useFinance();
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !ready) return;
    router.replace(data.onboardingComplete ? '/(tabs)' : '/onboarding');
  }, [data.onboardingComplete, isLoaded, isSignedIn, ready]);
  if (isLoaded && isSignedIn && ready) return <Redirect href={data.onboardingComplete ? '/(tabs)' : '/onboarding'} />;
  return <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}>
    <View style={{ alignItems: 'center', gap: 20, paddingHorizontal: 10 }}>
      <Image source={require('../assets/images/icon.png')} style={{ width: 84, height: 84, borderRadius: 24 }} />
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontSize: 36, fontWeight: '700', letterSpacing: -1.3 }}>FinTwin</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 15, textAlign: 'center', lineHeight: 23 }}>
          See your whole financial picture, make a plan, and understand what could happen next.
        </Text>
      </View>
      <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
        <PrimaryButton title="Create your account" onPress={() => router.push('/(auth)/sign-up')} icon="arrow-right" testID="welcome-sign-up" />
        <OutlineButton title="Sign in" onPress={() => router.push('/(auth)/sign-in')} testID="welcome-sign-in" />
      </View>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 8 }}>
        Your financial entries stay on this device. FinTwin AI only receives the snapshot needed to answer the question you ask.
      </Text>
    </View>
  </Screen>;
}
