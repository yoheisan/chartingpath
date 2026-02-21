
-- Conversations table
CREATE TABLE public.copilot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.copilot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_copilot_conversations_user ON public.copilot_conversations(user_id, updated_at DESC);
CREATE INDEX idx_copilot_messages_convo ON public.copilot_messages(conversation_id, created_at);

-- RLS
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON public.copilot_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own conversations"
  ON public.copilot_messages FOR ALL
  USING (conversation_id IN (SELECT id FROM public.copilot_conversations WHERE user_id = auth.uid()))
  WITH CHECK (conversation_id IN (SELECT id FROM public.copilot_conversations WHERE user_id = auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_copilot_conversations_updated_at
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
