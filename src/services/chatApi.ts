import api from '@/interceptor/api';
import { Contact, ApiResponse, CreateContactRequest } from '@/types/chat';

export const chatApi = {
  // Get all contacts for a user
  getContacts: async (userId: string): Promise<ApiResponse<Contact[]>> => {
    return api.get(`/api/contact/user/${userId}`);
  },

  // Create a new contact/conversation
  createContact: async (data: CreateContactRequest): Promise<ApiResponse<Contact>> => {
    return api.post('/api/contact', data);
  },

  // Get a single contact by ID
  getContact: async (contactId: string): Promise<ApiResponse<Contact>> => {
    return api.get(`/api/contact/${contactId}`);
  },

  // Add a message to a contact
  addMessage: async (contactId: string, message: string): Promise<ApiResponse<Contact>> => {
    return api.post(`/api/contact/${contactId}/message`, { message });
  },

  // Update a message
  updateMessage: async (contactId: string, messageId: string, message: string): Promise<ApiResponse<Contact>> => {
    return api.put(`/api/contact/${contactId}/message/${messageId}`, { message });
  },

  // Delete a message
  deleteMessage: async (contactId: string, messageId: string): Promise<ApiResponse<Contact>> => {
    return api.delete(`/api/contact/${contactId}/message/${messageId}`);
  },

  // Delete a contact
  deleteContact: async (contactId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.delete(`/api/contact/${contactId}`);
  },
};
