import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, Modal,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ProjectsScreen({ navigation }) {
  const [projects, setProjects] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // project being edited or null
  const [form, setForm] = useState({ name: '', description: '', status: 'PLANNED' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [ps, ts] = await Promise.all([api.getProjects(), api.getTasks()]);
      setProjects(ps);
      const counts = {};
      ts.forEach((t) => { counts[t.project_id] = (counts[t.project_id] || 0) + 1; });
      setTaskCounts(counts);
    } catch (e) {
      setError(e.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', status: 'PLANNED' });
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.updateProject(editing.id, form);
      } else {
        await api.createProject(form);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (project) => {
    Alert.alert('Delete Project', `Delete "${project.name}" and all its tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteProject(project.id);
            await load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Projects</Text>
        <Button title="+ Add Project" onPress={openCreate} style={{ paddingHorizontal: 14 }} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={projects}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No projects yet.</Text>
            <Text style={styles.emptyText}>Create your first project to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            taskCount={taskCounts[item.id]}
            onView={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
            onEdit={() => openEdit(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Project' : 'New Project'}
            </Text>

            <Input
              label="Name" value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="My project"
              autoCapitalize="sentences"
            />
            <Input
              label="Description" value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              placeholder="Optional description"
              autoCapitalize="sentences"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {['PLANNED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
                <Text
                  key={s}
                  onPress={() => setForm({ ...form, status: s })}
                  style={[styles.statusChip, form.status === s && styles.statusChipActive]}
                >
                  {s}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setModalOpen(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title={editing ? 'Update' : 'Create'} onPress={save} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heading: { fontSize: 22, fontWeight: '800', color: '#111827' },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { color: '#6b7280', marginTop: 4 },
  error: { color: '#dc2626', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#111827' },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap' },
  statusChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#f3f4f6', marginRight: 8, marginBottom: 8,
    color: '#374151', fontWeight: '600', fontSize: 12,
  },
  statusChipActive: { backgroundColor: '#2563eb', color: '#fff' },
});