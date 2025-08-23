-- Create storage bucket for strategy downloads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('strategy-downloads', 'strategy-downloads', true);

-- Create RLS policies for strategy downloads
CREATE POLICY "Anyone can download strategy files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'strategy-downloads');

CREATE POLICY "Authenticated users can upload strategy files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'strategy-downloads' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their strategy files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'strategy-downloads' AND auth.role() = 'authenticated');