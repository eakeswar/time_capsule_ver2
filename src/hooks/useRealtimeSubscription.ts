
import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealtimePayload {
  commit_timestamp: string;
  eventType: string;
  schema: string;
  table: string;
  new: {
    [key: string]: any;
    user_id?: string;
    file_name?: string;
    status?: string;
  };
  old?: {
    [key: string]: any;
    status?: string;
  };
}

/**
 * Hook for managing Supabase realtime subscriptions
 */
export function useRealtimeSubscription(user: any, fetchFiles: () => Promise<void>) {
  const realtimeChannelRef = useRef<any>(null);
  const { toast } = useToast();
  
  const setupRealtimeSubscription = useCallback(() => {
    if (realtimeChannelRef.current) {
      console.log("Cleaning up existing realtime subscription");
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    
    if (!user) return;
    
    console.log("Setting up realtime subscription for scheduled_files table");
    
    const channel = supabase
      .channel('scheduled_files_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_files',
        },
        (payload: RealtimePayload) => {
          console.log('Real-time update received:', payload);
          
          const userId = payload.new?.user_id;
          
          if (userId && user && userId === user.id) {
            setTimeout(() => {
              console.log("Triggering fetch after realtime update");
              fetchFiles();
            }, 1000);
            
            if (payload.eventType === 'UPDATE' && 
                payload.new && payload.old && 
                payload.new.status !== payload.old.status) {
              
              if (payload.new.status === 'sent' && 
                  (payload.old.status === 'pending' || payload.old.status === 'processing')) {
                toast({
                  title: "File Sent",
                  description: `The file "${payload.new.file_name}" has been sent.`,
                  duration: 3000
                });
              } else if (payload.new.status === 'failed' && 
                        (payload.old.status === 'pending' || payload.old.status === 'processing')) {
                toast({
                  variant: "destructive",
                  title: "File Failed",
                  description: `Failed to send "${payload.new.file_name}".`,
                  duration: 3000
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
      
    realtimeChannelRef.current = channel;
    
    return () => {
      if (realtimeChannelRef.current) {
        console.log("Removing realtime subscription");
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [fetchFiles, toast, user]);
  
  // Setup and cleanup the realtime subscription
  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return () => {
      if (cleanup) cleanup();
    };
  }, [setupRealtimeSubscription, user]);

  return { setupRealtimeSubscription };
}
