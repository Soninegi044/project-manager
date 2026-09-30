import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const onLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const created = user && user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : '—';

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user && user.name ? user.name[0].toUpperCase() : '?'}
        </Text>
      </View>
      <Text style={styles.name}>{user ? user.name : ''}</Text>
      <Text style={styles.email}>{user ? user.email : ''}</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Account created</Text>
        <Text style={styles.infoValue}>{created}</Text>
      </View>

      <Button
        title="Logout"
        variant="secondary"
        onPress={onLogout}
        style={{ marginTop: 24, width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { color: '#6b7280', marginTop: 4 },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoLabel: { color: '#6b7280', fontSize: 12 },
  infoValue: { color: '#111827', fontWeight: '600', marginTop: 4 },
});
