import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ProjectCard({ project, taskCount, onView, onEdit, onDelete }) {
  const statusColor = {
    PLANNED: '#6b7280', IN_PROGRESS: '#2563eb', COMPLETED: '#16a34a',
  }[project.status] || '#6b7280';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{project.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{project.status}</Text>
        </View>
      </View>
      {!!project.description && <Text style={styles.desc}>{project.description}</Text>}
      <Text style={styles.meta}>{taskCount ?? 0} task(s)</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onView}>
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
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
  name: { fontSize: 16, fontWeight: '700', flex: 1, color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  desc: { color: '#4b5563', marginTop: 6 },
  meta: { color: '#6b7280', marginTop: 6, fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 12 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 8 },
  actionText: { color: '#2563eb', fontWeight: '600' },
});