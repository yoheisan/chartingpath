
CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text,
  status text NOT NULL,
  resend_message_id text,
  error_message text,
  brief_mode text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
  ON public.email_send_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_email_send_log_user_id ON public.email_send_log(user_id);
CREATE INDEX idx_email_send_log_created_at ON public.email_send_log(created_at DESC);
CREATE INDEX idx_email_send_log_status ON public.email_send_log(status);
