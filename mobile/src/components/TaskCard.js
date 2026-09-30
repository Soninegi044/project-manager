import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function TaskCard({ task, onToggleComplete, onDelete, showProject }) {
  const isCompleted = task.status === 'COMPLETED';
  const priorityColor = { LOW: '#6b7280', MEDIUM: '#f59e0b', HIGH: '#dc2626' }[task.priority];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.title, isCompleted && styles.strike]}>{task.title}</Text>
        <View style={[styles.badge, { backgroundColor: priorityColor }]}>
          <Text style={styles.badgeText}>{task.priority}</Text>
        </View>
      </View>
      {showProject && <Text style={styles.meta}>Project #{task.project_id}</Text>}
      <Text style={styles.meta}>Status: {task.status}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onToggleComplete(!isCompleted)}>
          <Text style={styles.actionText}>
            {isCompleted ? 'Mark Pending' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onDelete}>
          <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', flex: 1, color: '#111827' },
  strike: { textDecorationLine: 'line-through', color: '#9ca3af' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  meta: { color: '#6b7280', marginTop: 4, fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 12 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 8 },
  actionText: { color: '#2563eb', fontWeight: '600' },
});