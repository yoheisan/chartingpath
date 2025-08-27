-- Create tables for site scanning and version management

-- Site scan sessions to track different scans
CREATE TABLE public.site_scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version_number INTEGER NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'in_progress',
  total_strings_found INTEGER DEFAULT 0,
  new_strings_count INTEGER DEFAULT 0,
  modified_strings_count INTEGER DEFAULT 0,
  scan_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Extracted strings from site scans with versioning
CREATE TABLE public.extracted_strings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_session_id UUID NOT NULL REFERENCES public.site_scan_sessions(id) ON DELETE CASCADE,
  string_key TEXT NOT NULL, -- Auto-generated or manual key
  original_text TEXT NOT NULL,
  context_path TEXT, -- URL path where found
  context_element TEXT, -- HTML element type/class
  context_selector TEXT, -- CSS selector path
  parent_component TEXT, -- React component name if applicable
  string_hash TEXT NOT NULL, -- Hash of the string for change detection
  extraction_method TEXT DEFAULT 'automated', -- automated, manual
  is_translatable BOOLEAN DEFAULT true,
  review_status TEXT DEFAULT 'pending', -- pending, approved, rejected, auto_approved
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Track string changes between versions
CREATE TABLE public.string_change_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  string_key TEXT NOT NULL,
  old_scan_session_id UUID REFERENCES public.site_scan_sessions(id),
  new_scan_session_id UUID REFERENCES public.site_scan_sessions(id),
  change_type TEXT NOT NULL, -- 'added', 'modified', 'removed'
  old_text TEXT,
  new_text TEXT,
  old_hash TEXT,
  new_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_strings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.string_change_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage scan sessions" 
ON public.site_scan_sessions 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage extracted strings" 
ON public.extracted_strings 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view string changes" 
ON public.string_change_log 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_extracted_strings_scan_session ON public.extracted_strings(scan_session_id);
CREATE INDEX idx_extracted_strings_key_hash ON public.extracted_strings(string_key, string_hash);
CREATE INDEX idx_string_change_log_sessions ON public.string_change_log(old_scan_session_id, new_scan_session_id);
CREATE INDEX idx_site_scan_sessions_version ON public.site_scan_sessions(version_number);

-- Add trigger for updated_at
CREATE TRIGGER update_extracted_strings_updated_at
BEFORE UPDATE ON public.extracted_strings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();