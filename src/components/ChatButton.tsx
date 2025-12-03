import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RootState, AppDispatch } from '@/Redux/store';
import { createConversation, fetchConversation, setCurrentConversation } from '@/Redux/Slices/chatSlice';
import { setChatModalOpen } from '@/Redux/Slices/uiSlice';
import { authHelpers } from '@/services/api';

interface ChatButtonProps {
  ownerId: string;
  propertyTitle: string;
  className?: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({ ownerId, propertyTitle, className }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { conversations, loading } = useSelector((state: RootState) => state.chat);

  const currentUserId = authHelpers.getCurrentUserId();
  const isLoggedIn = !!currentUserId;

  const handleChatClick = async () => {
    if (!isLoggedIn) {
      // Redirect to auth if not logged in
      navigate('/auth');
      return;
    }

    if (!ownerId || ownerId === currentUserId) {
      return; // Can't chat with yourself
    }

    try {
      // Check if conversation already exists
      const existingConversation = conversations.find(
        conv => conv.otherUser._id === ownerId
      );

      if (existingConversation) {
        // Open existing conversation
        dispatch(setCurrentConversation(existingConversation));
        await dispatch(fetchConversation(existingConversation.contactId));
        dispatch(setChatModalOpen(true));
      } else {
        // Create new conversation
        const result = await dispatch(createConversation({ contactUserId: ownerId }));
        if (createConversation.fulfilled.match(result)) {
          await dispatch(fetchConversation(result.payload._id));
          dispatch(setChatModalOpen(true));
        }
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  return (
    <Button
      onClick={handleChatClick}
      disabled={loading || !ownerId || ownerId === currentUserId}
      className={`gap-2 ${className}`}
      variant="outline"
      aria-label={`Contact owner about ${propertyTitle}`}
    >
      <MessageCircle className="w-4 h-4" />
      Contact with Guest House
    </Button>
  );
};

export default ChatButton;