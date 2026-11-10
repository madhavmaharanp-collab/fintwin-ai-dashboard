import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/expo';
import { useRouter, type Href } from 'expo-router';
import { useColors } from '@/hooks/useColors';

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton() {
  const colors = useColors();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [error, setError] = useState('');
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
  const signIn = async () => {
    setError('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'fintwin' }),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) { setError('Complete the extra verification step to continue.'); return; }
            router.replace(decorateUrl('/') as Href);
          },
        });
      } else setError('Google sign-in needs an enabled Google provider. Use email and password instead.');
    } catch {
      setError('Google sign-in is unavailable right now. You can still use email and password.');
    }
  };
  return <View style={{ gap: 8 }}>
    <Pressable accessibilityRole="button" onPress={signIn} style={({ pressed }) => ({
      minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.75 : 1,
    })}>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>Continue with Google</Text>
    </Pressable>
    {error ? <Text style={{ color: colors.destructive, fontSize: 12, lineHeight: 18 }}>{error}</Text> : null}
  </View>;
}
