
import { useCallback, useEffect, useRef, useState } from "react";
import { triggerFileSending } from "@/services/fileService";
import { FileItem } from "@/components/FileCard";
import { compareDates } from "@/utils/dateDebugger";

/**
 * Hook for checking and triggering pending files
 */
export function usePendingFileChecker(
  files: FileItem[],
  user: any,
  initialLoadComplete: boolean,
  fetchFiles: () => Promise<void>
) {
  const refreshIntervalRef = useRef<number | null>(null);
  
  const checkAndTriggerPendingFiles = useCallback(async () => {
    if (!user || !initialLoadComplete) return;
    
    try {
      const now = new Date();
      console.log("Current time for comparison:", now.toISOString());
      
      const pendingPastDue = files.filter(file => {
        const isPending = file.status === 'pending';
        const fileDate = new Date(file.scheduledDate);
        
        const isScheduledDatePast = fileDate.getTime() <= now.getTime();
        
        // Compare dates with logging
        compareDates(fileDate, now, `File ${file.id} scheduled date`, "Current time");
        
        console.log(`File ${file.id}: status=${file.status}, scheduledDate=${fileDate.toISOString()}, isPast=${isScheduledDatePast}`);
        
        return isPending && isScheduledDatePast;
      });
      
      if (pendingPastDue.length > 0) {
        console.log(`Found ${pendingPastDue.length} pending files past due, triggering send`);
        await triggerFileSending();
        setTimeout(() => {
          fetchFiles();
        }, 3000);
      }
    } catch (error) {
      console.error("Error checking pending files:", error);
    }
  }, [user, files, fetchFiles, initialLoadComplete]);

  // Setup recurring check for pending files
  useEffect(() => {
    if (!user) return;
    
    const initialCheckTimer = setTimeout(() => {
      checkAndTriggerPendingFiles();
    }, 2000);
    
    if (refreshIntervalRef.current === null) {
      refreshIntervalRef.current = window.setInterval(() => {
        console.log("Auto-refreshing file list to check for pending deliveries");
        checkAndTriggerPendingFiles();
      }, 30000);
    }
    
    return () => {
      clearTimeout(initialCheckTimer);
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, checkAndTriggerPendingFiles]);

  return { checkAndTriggerPendingFiles };
}
