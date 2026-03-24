CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.saas_organizations(id) ON DELETE CASCADE,
  environment_id UUID REFERENCES public.saas_environments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('success', 'warning', 'info', 'error')),
  priority VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'critical')),
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.get_user_context())
    AND environment_id = (SELECT environment_id FROM public.get_user_context())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Update policy (for mark as read)
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.get_user_context())
    AND environment_id = (SELECT environment_id FROM public.get_user_context())
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Insert policy (For backend edges or triggers)
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.get_user_context())
    AND environment_id = (SELECT environment_id FROM public.get_user_context())
  );
