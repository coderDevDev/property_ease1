-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Allow system to create notifications for any user
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);
