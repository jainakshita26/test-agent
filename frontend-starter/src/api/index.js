// src/api/index.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add custom error handling here
    console.error('API Error:', error.response || error.message);
    return Promise.reject(error);
  }
);

// API functions

// Conversations
export const getConversations = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/api/conversations?${params}`);
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/api/conversations/${id}`);
  return response.data;
};

export const addMessage = async (conversationId, message) => {
  const response = await api.post(`/api/conversations/${conversationId}/messages`, message);
  return response.data;
};

export const updateConversationStatus = async (conversationId, status) => {
  const response = await api.patch(`/api/conversations/${conversationId}/status`, { status });
  return response.data;
};

export const addTags = async (conversationId, tags) => {
  const response = await api.post(`/api/conversations/${conversationId}/tags`, { tags });
  return response.data;
};

// Agents
export const getAgents = async () => {
  const response = await api.get('/api/agents');
  return response.data;
};

export const getAgent = async (id) => {
  const response = await api.get(`/api/agents/${id}`);
  return response.data;
};

export const updateAgentConfig = async (id, config) => {
  const response = await api.patch(`/api/agents/${id}/config`, config);
  return response.data;
};

export const getAgentMetrics = async (id) => {
  const response = await api.get(`/api/agents/${id}/metrics`);
  return response.data;
};

// Intervention
export const interveneInConversation = async (conversationId, supervisorId, notes) => {
  const response = await api.post('/api/intervene', { conversationId, supervisorId, notes });
  return response.data;
};

export const releaseIntervention = async (conversationId, supervisorNotes) => {
  const response = await api.post('/api/intervene/release', { conversationId, supervisorNotes });
  return response.data;
};

// Knowledge Base
export const getKnowledgeBases = async () => {
  const response = await api.get('/api/knowledge-base');
  return response.data;
};

// Analytics
export const getAnalytics = async (params) => {
  const response = await api.get('/api/analytics', { params });
  return response.data;
};

// Response templates
export const getTemplates = async () => {
  const response = await api.get('/api/templates');
  return response.data;
};

export const getTemplate = async (id) => {
  const response = await api.get(`/api/templates/${id}`);
  return response.data;
};

export const createTemplate = async (template) => {
  const response = await api.post('/api/templates', template);
  return response.data;
};

export const updateTemplate = async (id, patch) => {
  const response = await api.patch(`/api/templates/${id}`, patch);
  return response.data;
};

export const deleteTemplate = async (id) => {
  const response = await api.delete(`/api/templates/${id}`);
  return response.data;
};

// Supervisor feedback notes
export const saveConversationNotes = async (conversationId, supervisorNotes) => {
  const response = await api.patch(`/api/conversations/${conversationId}/notes`, { supervisorNotes });
  return response.data;
};

export default api;
