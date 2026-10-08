/**
 * Central API client.
 *
 * Base URL:
 *  - Android emulator  -> http://10.0.2.2:8000
 *  - iOS simulator     -> http://localhost:8000
 *  - Physical phone    -> http://<YOUR_PC_LAN_IP>:8000
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://192.168.0.101:8081';

const TOKEN_KEY = 'auth_token';

export async function saveToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request(path, options) {
  const opts = options || {};
  const method = opts.method || 'GET';
  const body = opts.body;
  const auth = opts.auth !== false;

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = 'Bearer ' + token;
  }

  let res;
  try {
    res = await fetch(API_URL + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Cannot reach server. Is the backend running?');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    const msg = data.detail || ('Request failed (' + res.status + ')');
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

// Auth
export const register = function (payload) {
  return request('/api/register', { method: 'POST', body: payload, auth: false });
};

export const login = function (payload) {
  return request('/api/login', { method: 'POST', body: payload, auth: false });
};

export const getCurrentUser = function () {
  return request('/api/me');
};

// Projects
export const getProjects = function () {
  return request('/api/projects');
};

export const getProject = function (id) {
  return request('/api/projects/' + id);
};

export const createProject = function (data) {
  return request('/api/projects', { method: 'POST', body: data });
};

export const updateProject = function (id, data) {
  return request('/api/projects/' + id, { method: 'PUT', body: data });
};

export const deleteProject = function (id) {
  return request('/api/projects/' + id, { method: 'DELETE' });
};

// Tasks
export const getTasks = function (projectId) {
  if (projectId) {
    return request('/api/tasks?project_id=' + projectId);
  }
  return request('/api/tasks');
};

export const createTask = function (data) {
  return request('/api/tasks', { method: 'POST', body: data });
};

export const updateTask = function (id, data) {
  return request('/api/tasks/' + id, { method: 'PUT', body: data });
};

export const deleteTask = function (id) {
  return request('/api/tasks/' + id, { method: 'DELETE' });
};

// Dashboard
export const getDashboard = function () {
  return request('/api/dashboard');
};
