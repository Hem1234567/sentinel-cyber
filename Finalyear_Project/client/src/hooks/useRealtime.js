import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLogStore } from '../store/useLogStore';

export const useRealtime = (projectId) => {
  const { addLiveLog, addLiveAlert } = useLogStore();
  const channelRef = useRef(null);

  useEffect(() => {
    if (!projectId) return;

    // Connect to Supabase Realtime
    const channel = supabase.channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs', filter: `project_id=eq.${projectId}` },
        (payload) => {
          console.log('New log received via Realtime');
          addLiveLog(payload.new);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts', filter: `project_id=eq.${projectId}` },
        (payload) => {
          console.log('New alert received via Realtime');
          addLiveAlert(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase Realtime for project:', projectId);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId, addLiveLog, addLiveAlert]);

  return channelRef.current;
};
