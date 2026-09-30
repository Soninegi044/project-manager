import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../services/api';
import TaskCard from '../components/TaskCard';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const ts = await api.getTasks();
      setTasks(ts);
    } catch (e) {
      setError(e.message || 'Unable to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const toggleComplete = async (task, complete) => {
    try {
      await api.updateTask(task.id, {
        status: complete ? 'COMPLETED' : 'TODO',
      });
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const confirmDelete = (task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTask(task.id);
            await load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    if (filter === 'PENDING') return t.status !== 'COMPLETED';
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {['ALL', 'PENDING', 'COMPLETED'].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks yet.</Text>
            <Text style={styles.emptyText}>Add a task from any project.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            showProject
            onToggleComplete={(complete) => toggleComplete(item, complete)}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f3f4f6', marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { color: '#6b7280', marginTop: 4 },
  error: { color: '#dc2626', marginBottom: 8 },
});