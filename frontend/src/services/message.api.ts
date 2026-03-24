import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const withAuth = (token?: string, config: AxiosRequestConfig = {}): AxiosRequestConfig => ({
  ...config,
  headers: {
    'Content-Type': 'application/json',
    ...(config.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

// Send message to librarian or reader
export const sendMessage = (content: string, token?: string, receiverId?: string, config?: AxiosRequestConfig) =>
  axios.post(`${API_BASE_URL}/messages/send`, { content, receiverId }, withAuth(token, config));

// Get all conversations of the user
export const getConversations = (token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/messages/conversations`, withAuth(token, config));

// Get messages by conversation ID
export const getConversationMessages = (conversationId: string, token?: string, config?: AxiosRequestConfig) =>
  axios.get(`${API_BASE_URL}/messages/conversations/${conversationId}/messages`, withAuth(token, config));

// Mark conversation as read
export const markConversationAsRead = (conversationId: string, token?: string, config?: AxiosRequestConfig) =>
  axios.patch(`${API_BASE_URL}/messages/conversations/${conversationId}/read`, {}, withAuth(token, config));

export default {
  sendMessage,
  getConversations,
  getConversationMessages,
  markConversationAsRead,
};
