import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function HomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const results = await Promise.all([
        api.getDashboard(),
        api.getProjects(),
        api.getTasks(),
      ]);
      setStats(results[0]);
      setProjects(results[1].slice(0, 3));
      setTasks(results[2].slice(0, 3));
    } catch (e) {
      setError(e.message || 'Unable to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Text style={styles.hello}>Hello, {user ? user.name : 'User'} 👋</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#2563eb' }]}>
            {stats ? stats.total_projects : 0}
          </Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#7c3aed' }]}>
            {stats ? stats.total_tasks : 0}
          </Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#16a34a' }]}>
            {stats ? stats.completed_tasks : 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {stats ? stats.pending_tasks : 0}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Projects</Text>
      {projects.length === 0 ? (
        <Text style={styles.empty}>No projects yet. Go to Projects tab to create one.</Text>
      ) : (
        projects.map((p) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.rowTitle}>{p.name}</Text>
            <Text style={styles.rowMeta}>{p.status}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Recent Tasks</Text>
      {tasks.length === 0 ? (
        <Text style={styles.empty}>No tasks yet.</Text>
      ) : (
        tasks.map((t) => (
          <View key={t.id} style={styles.row}>
            <Text style={styles.rowTitle}>{t.title}</Text>
            <Text style={styles.rowMeta}>{t.status}</Text>
          </View>
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hello: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: '#111827' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 8, color: '#111827' },
  row: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rowTitle: { color: '#111827', fontWeight: '600' },
  rowMeta: { color: '#6b7280', fontSize: 12 },
  empty: { color: '#6b7280', fontStyle: 'italic', marginBottom: 8 },
  error: { color: '#dc2626', marginBottom: 8 },
});
