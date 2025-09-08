import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Send, Bot, User, AlertTriangle, HelpCircle, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface CommunityMessage {
  id: string;
  content: string;
  message_type: string;
  is_ai_response: boolean;
  ai_confidence_score?: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user_id: string;
  parent_id?: string;
}

interface CommunityChatInterfaceProps {
  onOpenModeratorContact: () => void;
}

const CommunityChatInterface: React.FC<CommunityChatInterfaceProps> = ({ onOpenModeratorContact }) => {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'message' | 'question' | 'feedback' | 'urgent'>('message');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to real-time message updates
    const channel = supabase
      .channel('community-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages'
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as CommunityMessage]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('parent_id', null)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load community messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to post messages",
          variant: "destructive",
        });
        return;
      }

      // Insert the user message
      const { data: userMessage, error } = await supabase
        .from('community_messages')
        .insert({
          content: newMessage,
          message_type: messageType,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Check if this message should get an AI response
      if (messageType === 'question' || messageType === 'urgent') {
        try {
          const { data: aiResponse } = await supabase.functions.invoke('community-ai-assistant', {
            body: {
              messageContent: newMessage,
              messageType: messageType,
              userId: user.id
            }
          });

          if (aiResponse?.shouldRespond && aiResponse?.response) {
            // AI response is already stored by the edge function
            toast({
              title: "AI Assistant Responded",
              description: "Our AI assistant has provided a helpful response to your question.",
            });
          } else if (messageType === 'urgent') {
            toast({
              title: "Urgent Issue Noted",
              description: "Your urgent message has been flagged for moderator attention. Consider using the 'Contact Moderator' feature for immediate assistance.",
            });
          }
        } catch (aiError) {
          console.error('AI response error:', aiError);
          // Don't show error to user, AI failure shouldn't block message posting
        }
      }

      setNewMessage('');
      setMessageType('message');
      toast({
        title: "Message Posted",
        description: "Your message has been posted to the community.",
      });
    } catch (error) {
      console.error('Error posting message:', error);
      toast({
        title: "Error",
        description: "Failed to post message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to like messages",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('community_message_likes')
        .insert({
          user_id: user.id,
          message_id: messageId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // User already liked this message, try to unlike
          await supabase
            .from('community_message_likes')
            .delete()
            .match({
              user_id: user.id,
              message_id: messageId
            });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error liking message:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <HelpCircle className="h-4 w-4" />;
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'feedback': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'feedback': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Community Chat</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenModeratorContact}
            className="text-sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Contact Moderator
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions, share insights, and connect with fellow traders
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {message.is_ai_response ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {message.is_ai_response ? 'AI Assistant' : 'Community Member'}
                    </span>
                    <Badge variant="secondary" className={`text-xs ${getMessageTypeColor(message.message_type)}`}>
                      {getMessageTypeIcon(message.message_type)}
                      <span className="ml-1 capitalize">{message.message_type}</span>
                    </Badge>
                    {message.is_ai_response && message.ai_confidence_score && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(message.ai_confidence_score * 100)}% confidence
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-foreground bg-muted/50 rounded-lg p-3">
                    {message.content}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeMessage(message.id)}
                      className="h-8 px-2"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      {message.likes_count}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {message.replies_count}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Message</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-h-[40px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitMessage();
              }
            }}
          />
          
          <Button
            onClick={handleSubmitMessage}
            disabled={!newMessage.trim() || isSubmitting}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {messageType === 'question' && 'Questions may get an AI response for quick help'}
          {messageType === 'urgent' && 'Urgent messages are flagged for moderator attention'}
          {messageType === 'feedback' && 'Share your thoughts to help us improve'}
        </div>
      </div>
    </Card>
  );
};

export default CommunityChatInterface;