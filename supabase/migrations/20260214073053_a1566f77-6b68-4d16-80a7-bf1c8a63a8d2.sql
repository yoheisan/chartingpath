-- Add symmetrical-triangle and inverse-cup-and-handle to chart_pattern enum
ALTER TYPE public.chart_pattern ADD VALUE IF NOT EXISTS 'symmetrical-triangle';
ALTER TYPE public.chart_pattern ADD VALUE IF NOT EXISTS 'inverse-cup-and-handle';