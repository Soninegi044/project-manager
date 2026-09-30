import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../services/api';
import TaskCard from '../components/TaskCard';
import Button from '../components/Button';
import Input from '../components/Input';

export default function ProjectDetailsScreen({ route, navigation }) {
  const projectId = route.params.projectId;

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    try {
      const results = await Promise.all([
        api.getProject(projectId),
        api.getTasks(projectId),
      ]);
      setProject(results[0]);
      setTasks(results[1]);
    } catch (e) {
      setError(e.message || 'Unable to load project.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [projectId])
  );

  const openModal = () => {
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setModalOpen(true);
  };

  const addTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }
    setSaving(true);
    try {
      await api.createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        status: 'TODO',
        project_id: projectId,
      });
      setModalOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

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

  const confirmDeleteTask = (task) => {
    Alert.alert('Delete Task', 'Delete "' + task.title + '"?', [
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading project...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Retry" onPress={load} style={{ marginTop: 12 }} />
      </View>
    );
  }

  const statusColor = project && project.status === 'IN_PROGRESS'
    ? '#2563eb'
    : project && project.status === 'COMPLETED'
    ? '#16a34a'
    : '#6b7280';

  return (
    <View style={styles.container}>
      <View style={styles.projectCard}>
        <View style={styles.row}>
          <Text style={styles.projectName}>{project ? project.name : ''}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{project ? project.status : ''}</Text>
          </View>
        </View>
        {project && project.description ? (
          <Text style={styles.projectDesc}>{project.description}</Text>
        ) : null}
        <Text style={styles.projectMeta}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tasks</Text>
        <Button
          title="+ Add Task"
          onPress={openModal}
          style={{ paddingHorizontal: 14, paddingVertical: 8 }}
        />
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No tasks yet.</Text>
            <Text style={styles.emptyText}>Add a task to get started.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={(complete) => toggleComplete(item, complete)}
            onDelete={() => confirmDeleteTask(item)}
          />
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>

            <Input
              label="Title"
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="What needs to be done?"
              autoCapitalize="sentences"
            />
            <Input
              label="Description"
              value={taskDesc}
              onChangeText={setTaskDesc}
              placeholder="Optional details"
              autoCapitalize="sentences"
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.chipRow}>
              {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                <Text
                  key={p}
                  onPress={() => setTaskPriority(p)}
                  style={[
                    styles.chip,
                    taskPriority === p && styles.chipActive,
                  ]}
                >
                  {p}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Add"
                onPress={addTask}
                loading={saving}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  error: { color: '#dc2626', textAlign: 'center' },
  projectCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: { fontSize: 18, fontWeight: '800', color: '#111827', flex: 1 },
  projectDesc: { color: '#4b5563', marginTop: 8 },
  projectMeta: { color: '#6b7280', marginTop: 8, fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptyText: { color: '#6b7280', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#111827' },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
    color: '#374151',
    fontWeight: '600',
    fontSize: 12,
  },
  chipActive: { backgroundColor: '#2563eb', color: '#fff' },
});
