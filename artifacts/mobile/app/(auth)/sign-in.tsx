import React, { useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSignIn } from '@clerk/expo';
import { router, type Href } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { GoogleAuthButton } from '@/components/AuthControls';
import { PrimaryButton } from '@/components/FinanceUi';

export default function SignInScreen() {
  const colors = useColors();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputStyle = { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 14, backgroundColor: colors.card, color: colors.foreground, fontSize: 15 };
  const finish = async () => signIn.finalize({ navigate: ({ session, decorateUrl }) => {
    if (session?.currentTask) { setError('Complete the security check to continue.'); return; }
    router.replace(decorateUrl('/') as Href);
  } });
  const submit = async () => {
    setError('');
    const result = await signIn.password({ emailAddress: email.trim(), password });
    if (result.error) { setError(result.error.message); return; }
    if (signIn.status === 'complete') await finish();
    else if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const emailFactor = signIn.supportedSecondFactors.find((factor) => factor.strategy === 'email_code');
      if (emailFactor) { await signIn.mfa.sendEmailCode(); setVerifying(true); }
      else setError('This account needs a verification method that is not available here.');
    } else setError('Sign-in needs another step. Check your account settings and try again.');
  };
  const verify = async () => {
    setError('');
    const result = await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (result.error) { setError(result.error.message); return; }
    if (signIn.status === 'complete') await finish();
  };
  return <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 67 }}>
    <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 24, paddingBottom: 36, gap: 17, flexGrow: 1, justifyContent: 'center' }} bottomOffset={60} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 7, marginBottom: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.1 }}>FINTWIN</Text>
        <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: '700' }}>{verifying ? 'Check your email' : 'Welcome back'}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 21 }}>{verifying ? 'Enter the security code we sent to your inbox.' : 'Sign in to see your financial picture.'}</Text>
      </View>
      {!verifying ? <>
        <GoogleAuthButton />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>or continue with email</Text><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /></View>
        <TextInput testID="signin-email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="Email address" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
        <TextInput testID="signin-password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Password" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
        <PrimaryButton title={fetchStatus === 'fetching' ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={!email.trim() || !password || fetchStatus === 'fetching'} testID="signin-submit" />
      </> : <>
        <TextInput testID="signin-code" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Verification code" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
        <PrimaryButton title="Verify and continue" onPress={verify} disabled={!code.trim() || fetchStatus === 'fetching'} testID="signin-verify" />
        <Pressable onPress={() => signIn.mfa.sendEmailCode()}><Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Send another code</Text></Pressable>
      </>}
      {error ? <Text style={{ color: colors.destructive, fontSize: 13, lineHeight: 19 }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>New to FinTwin?</Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-up')}><Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Create account</Text></Pressable>
      </View>
      <Pressable onPress={() => router.replace('/')}><Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center' }}>Back to welcome</Text></Pressable>
    </KeyboardAwareScrollViewCompat>
  </View>;
}
