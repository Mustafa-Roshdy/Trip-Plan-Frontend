import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, Conversation, Message, Contact, SendMessageRequest, UpdateMessageRequest, CreateContactRequest } from '@/types/chat';
import { chatApi } from '@/services/chatApi';
import { authHelpers } from '@/services/api';

const swapRole = (role: 'me' | 'other'): 'me' | 'other' => (role === 'me' ? 'other' : 'me');

const adjustMessagesForUser = (messages: Message[] = [], isPrimary: boolean): Message[] =>
  messages.map((message) => ({
    ...message,
    role: isPrimary ? message.role : swapRole(message.role),
  }));

const buildConversationFromContact = (contact: Contact, currentUserId: string) => {
  const isPrimary = contact.user._id === currentUserId;
  const adjustedMessages = adjustMessagesForUser(contact.messages, isPrimary);
  const otherUser = isPrimary ? contact.contactUser : contact.user;
  const lastMessage = adjustedMessages.length ? adjustedMessages[adjustedMessages.length - 1] : undefined;

  return {
    conversation: {
      id: contact._id,
      contactId: contact._id,
      otherUser,
      lastMessage,
      unreadCount: 0,
      createdAt: contact.createdAt,
    } as Conversation,
    messages: adjustedMessages,
  };
};

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCounts: {},
  loading: false,
  error: null,
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (userId: string) => {
    const response = await chatApi.getContacts(userId);
    return response.data;
  }
);

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (data: CreateContactRequest) => {
    const response = await chatApi.createContact(data);
    return response.data;
  }
);

export const fetchConversation = createAsyncThunk(
  'chat/fetchConversation',
  async (contactId: string) => {
    const response = await chatApi.getContact(contactId);
    const contact = response.data;

    // Get current user ID from auth helpers
    const currentUserId = authHelpers.getCurrentUserId();

    // Adjust message roles based on current user
    // If current user is the contact owner (user field), roles stay as is
    // If current user is the contact user (contactUser field), swap roles
    const isCurrentUserTheOwner = contact.user._id === currentUserId;

    const adjustedMessages = contact.messages.map(message => ({
      ...message,
      role: isCurrentUserTheOwner ? message.role : (message.role === 'me' ? 'other' : 'me')
    }));

    return {
      ...contact,
      messages: adjustedMessages
    };
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ contactId, message }: SendMessageRequest) => {
    const response = await chatApi.addMessage(contactId, message);
    return response.data;
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async ({ contactId, messageId, message }: UpdateMessageRequest) => {
    const response = await chatApi.updateMessage(contactId, messageId, message);
    return response.data;
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ contactId, messageId }: { contactId: string; messageId: string }) => {
    const response = await chatApi.deleteMessage(contactId, messageId);
    return response.data;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      const nextConversation = action.payload;
      if (nextConversation && nextConversation.id !== state.currentConversation?.id) {
        state.messages = [];
      }
      state.currentConversation = nextConversation;
      if (nextConversation) {
        // Mark messages as read when opening conversation
        state.unreadCounts[nextConversation.id] = 0;
      }
    },
    addMessageOptimistically: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateMessageOptimistically: (state, action: PayloadAction<{ messageId: string; message: string }>) => {
      const message = state.messages.find(m => m._id === action.payload.messageId);
      if (message) {
        message.message = action.payload.message;
        message.updatedAt = new Date().toISOString();
      }
    },
    removeMessageOptimistically: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(m => m._id !== action.payload);
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      state.unreadCounts[action.payload] = (state.unreadCounts[action.payload] || 0) + 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Contact[]>) => {
        state.loading = false;
        const currentUserId = authHelpers.getCurrentUserId();
        state.conversations = action.payload.map(contact =>
          buildConversationFromContact(contact, currentUserId).conversation
        );
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      })
      // createConversation
      .addCase(createConversation.fulfilled, (state, action: PayloadAction<Contact>) => {
        const currentUserId = authHelpers.getCurrentUserId();
        const { conversation, messages } = buildConversationFromContact(action.payload, currentUserId);
        state.conversations = [
          conversation,
          ...state.conversations.filter((conv) => conv.id !== conversation.id),
        ];
        state.currentConversation = conversation;
        state.messages = messages;
      })
      // fetchConversation
      .addCase(fetchConversation.fulfilled, (state, action: PayloadAction<Contact>) => {
        const currentUserId = authHelpers.getCurrentUserId();
        const { conversation, messages } = buildConversationFromContact(action.payload, currentUserId);
        state.messages = messages;
        if (state.currentConversation && state.currentConversation.id === conversation.id) {
          state.currentConversation.lastMessage = conversation.lastMessage;
          state.currentConversation.otherUser = conversation.otherUser;
        } else {
          state.currentConversation = conversation;
        }
      })
      // sendMessage
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<Contact>) => {
        const currentUserId = authHelpers.getCurrentUserId();
        const { conversation, messages } = buildConversationFromContact(action.payload, currentUserId);
        state.messages = messages;
        if (state.currentConversation && state.currentConversation.id === conversation.id) {
          state.currentConversation.lastMessage = conversation.lastMessage;
          state.currentConversation.otherUser = conversation.otherUser;
        } else {
          state.currentConversation = conversation;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to send message';
      })
      // editMessage
      .addCase(editMessage.fulfilled, (state, action: PayloadAction<Contact>) => {
        const currentUserId = authHelpers.getCurrentUserId();
        const { conversation, messages } = buildConversationFromContact(action.payload, currentUserId);
        state.messages = messages;
        if (state.currentConversation && state.currentConversation.id === conversation.id) {
          state.currentConversation.lastMessage = conversation.lastMessage;
        }
      })
      .addCase(editMessage.rejected, (state, action) => {
        // Revert optimistic update on error
        state.error = action.error.message || 'Failed to edit message';
      })
      // deleteMessage
      .addCase(deleteMessage.fulfilled, (state, action: PayloadAction<Contact>) => {
        const currentUserId = authHelpers.getCurrentUserId();
        const { conversation, messages } = buildConversationFromContact(action.payload, currentUserId);
        state.messages = messages;
        if (state.currentConversation && state.currentConversation.id === conversation.id) {
          state.currentConversation.lastMessage = conversation.lastMessage;
        }
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        // Revert optimistic update on error
        state.error = action.error.message || 'Failed to delete message';
      });
  },
});

export const {
  setCurrentConversation,
  addMessageOptimistically,
  updateMessageOptimistically,
  removeMessageOptimistically,
  incrementUnreadCount,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;