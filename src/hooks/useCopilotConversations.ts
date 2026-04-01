import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CopilotConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CopilotMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export function useCopilotConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('copilot_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .neq('flow_type', 'onboarding')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Create new conversation
  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('copilot_conversations')
      .insert({ user_id: user.id, title: title || 'New conversation' })
      .select('id')
      .single();
    if (error || !data) return null;
    await fetchConversations();
    setActiveConversationId(data.id);
    return data.id;
  }, [user, fetchConversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string): Promise<CopilotMessage[]> => {
    setIsLoadingHistory(true);
    const { data } = await supabase
      .from('copilot_messages')
      .select('id, conversation_id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);
    setIsLoadingHistory(false);
    return (data as CopilotMessage[]) || [];
  }, []);

  // Save a message
  const saveMessage = useCallback(async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    await supabase.from('copilot_messages').insert({
      conversation_id: conversationId,
      role,
      content,
    });
    // Update conversation timestamp and auto-title from first user message
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (role === 'user') {
      // Auto-title with first ~60 chars of first user message
      const convo = conversations.find(c => c.id === conversationId);
      if (convo?.title === 'New conversation') {
        updates.title = content.slice(0, 60) + (content.length > 60 ? '…' : '');
      }
    }
    await supabase.from('copilot_conversations').update(updates).eq('id', conversationId);
    fetchConversations();
  }, [conversations, fetchConversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from('copilot_conversations').delete().eq('id', conversationId);
    if (activeConversationId === conversationId) setActiveConversationId(null);
    fetchConversations();
  }, [activeConversationId, fetchConversations]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoadingHistory,
    createConversation,
    loadMessages,
    saveMessage,
    deleteConversation,
    startNewChat,
    isAuthenticated: !!user,
  };
}
