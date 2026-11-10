import React, { useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSignUp } from '@clerk/expo';
import { router, type Href } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { GoogleAuthButton } from '@/components/AuthControls';
import { PrimaryButton } from '@/components/FinanceUi';

export default function SignUpScreen() {
  const colors = useColors();
  const { signUp, fetchStatus } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputStyle = { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 14, backgroundColor: colors.card, color: colors.foreground, fontSize: 15 };
  const finish = async () => signUp.finalize({ navigate: ({ session, decorateUrl }) => {
    if (session?.currentTask) { setError('Complete the security check to continue.'); return; }
    router.replace(decorateUrl('/') as Href);
  } });
  const create = async () => {
    setError('');
    const result = await signUp.password({ emailAddress: email.trim(), password });
    if (result.error) { setError(result.error.message); return; }
    if (signUp.status === 'complete') { await finish(); return; }
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) setError(sent.error.message); else setVerifying(true);
  };
  const verify = async () => {
    setError('');
    const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (result.error) { setError(result.error.message); return; }
    if (signUp.status === 'complete') await finish();
    else setError('The account needs another step. Review the information and try again.');
  };
  return <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: 67 }}>
    <KeyboardAwareScrollViewCompat contentContainerStyle={{ padding: 24, paddingBottom: 36, gap: 17, flexGrow: 1, justifyContent: 'center' }} bottomOffset={60} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 7, marginBottom: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.1 }}>FINTWIN</Text>
        <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: '700' }}>{verifying ? 'Verify your email' : 'Create your account'}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 21 }}>{verifying ? `We sent a one-time code to ${email}.` : 'Start with a private space for your money.'}</Text>
      </View>
      {!verifying ? <>
        <GoogleAuthButton />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>or use email</Text><View style={{ flex: 1, height: 1, backgroundColor: colors.border }} /></View>
        <TextInput testID="signup-email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="Email address" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
        <TextInput testID="signup-password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="Create a password" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
        <View nativeID="clerk-captcha" />
        <PrimaryButton title={fetchStatus === 'fetching' ? 'Creating…' : 'Create account'} onPress={create} disabled={!email.trim() || password.length < 8 || fetchStatus === 'fetching'} testID="signup-submit" />
        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17 }}>By continuing, you agree to use FinTwin as an educational planning tool, not as financial advice.</Text>
      </> : <>
        <TextInput testID="signup-code" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Verification code" placeholderTextColor={colors.mutedForeground} style={inputStyle} />
        <PrimaryButton title="Verify and continue" onPress={verify} disabled={!code.trim() || fetchStatus === 'fetching'} testID="signup-verify" />
        <Pressable onPress={() => signUp.verifications.sendEmailCode()}><Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '600' }}>Send a new code</Text></Pressable>
      </>}
      {error ? <Text style={{ color: colors.destructive, fontSize: 13, lineHeight: 19 }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>Already have an account?</Text>
        <Pressable onPress={() => router.replace('/(auth)/sign-in')}><Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Sign in</Text></Pressable>
      </View>
    </KeyboardAwareScrollViewCompat>
  </View>;
}
