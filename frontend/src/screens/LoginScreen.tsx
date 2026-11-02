import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { AppButton, Field, Message, styles } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Ingresa email y contraseña');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.screen, { justifyContent: 'center' }]}>
      <Text style={styles.title}>Agenda de citas</Text>
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="admin@miapp.com"
      />
      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="******"
        onSubmitEditing={handleLogin}
      />
      <Message text={error} />
      <AppButton title="Iniciar sesión" onPress={handleLogin} loading={loading} />
    </ScrollView>
  );
}
