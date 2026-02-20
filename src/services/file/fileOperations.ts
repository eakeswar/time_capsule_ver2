
import { supabase } from "@/integrations/supabase/client";
import { supabaseUnsafe } from "@/integrations/supabase/unsafe";
import { useToast, toast } from "@/hooks/use-toast";
import { FileItem } from "@/components/FileCard";
import { uploadFile } from "./fileStorage";
import { logDateDetails, formatDateForDatabase, isTimeToExecute } from "@/utils/dateDebugger";
import { triggerFileSending } from "./fileTrigger";


export interface ScheduleFileParams {
  file: File;
  recipient: string;
  scheduledDate: Date;
}

export interface UpdateScheduleParams {
  id: string;
  recipient: string;
  scheduledDate: Date;
}

/**
 * Schedules a file for future delivery
 */
export const scheduleFile = async ({ file, recipient, scheduledDate }: ScheduleFileParams): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Auth Error",
        description: "User not authenticated",
        duration: 3000,
        variant: "destructive"
      });
      throw new Error("User not authenticated");
    }
    
    const storagePath = await uploadFile(file, userData.user.id);
    const accessToken = crypto.randomUUID();
    
    // Format date as ISO string for PostgreSQL timestamp with time zone
    const formattedDate = formatDateForDatabase(scheduledDate);
    
    // Log date details for debugging
    logDateDetails(scheduledDate, "Scheduling file for date");
    console.log("Using formatted date for scheduled date:", formattedDate);
    
    // Use the RPC function to ensure proper timestamp handling
    const { error } = await supabaseUnsafe.rpc('schedule_file', {
      p_user_id: userData.user.id,
      p_file_name: file.name, 
      p_file_size: file.size,
      p_file_type: file.type,
      p_storage_path: storagePath,
      p_recipient_email: recipient,
      p_scheduled_date: formattedDate,
      p_access_token: accessToken
    });
      
    if (error) {
      console.error("Schedule error:", error);
      console.error("Error details:", error.details, error.hint, error.message);
      toast({
        title: "Error",
        description: `Failed to schedule: ${error.message}`,
        duration: 3000,
        variant: "destructive"
      });
      throw error;
    }
    
    toast({
      title: "Success",
      description: "File scheduled successfully",
      duration: 2000
    });
    
    // Check if the file should be sent immediately
    const now = new Date();
    if (scheduledDate.getTime() <= now.getTime()) {
      try {
        console.log("Immediate sending triggered: scheduled date is now or in the past");
        await triggerFileSending();
      } catch (triggerError) {
        console.log("Non-critical error when triggering immediate file sending:", triggerError);
      }
    }
  } catch (error: any) {
    console.error("Error scheduling file:", error);
    toast({
      title: "Schedule Error",
      description: `Error: ${error.message}`,
      duration: 3000,
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Updates an existing scheduled file
 */
export const updateScheduledFile = async ({ id, recipient, scheduledDate }: UpdateScheduleParams): Promise<void> => {
  try {
    // Format date as ISO string for PostgreSQL timestamp with time zone
    const formattedDate = formatDateForDatabase(scheduledDate);
    
    // Log date details for debugging
    logDateDetails(scheduledDate, "Updating schedule for date");
    console.log("Using formatted date for scheduled date:", formattedDate);
    
    // Use the RPC function to ensure proper timestamp handling
    const { error } = await supabaseUnsafe.rpc('update_scheduled_file', {
      p_id: id,
      p_recipient_email: recipient,
      p_scheduled_date: formattedDate
    });
      
    if (error) {
      console.error("Update error:", error);
      console.error("Error details:", error.details, error.hint, error.message);
      toast({
        title: "Update Error",
        description: `Failed: ${error.message}`,
        duration: 3000,
        variant: "destructive"
      });
      throw error;
    }
    
    toast({
      title: "Success",
      description: "Schedule updated",
      duration: 2000
    });
    
    // Check if the file should be sent immediately
    const now = new Date();
    if (scheduledDate.getTime() <= now.getTime()) {
      try {
        console.log("Immediate sending triggered after update: scheduled date is now or in the past");
        await triggerFileSending();
      } catch (triggerError) {
        console.log("Non-critical error when triggering file sending after update:", triggerError);
      }
    }
  } catch (error: any) {
    console.error("Error updating scheduled file:", error);
    toast({
      title: "Update Error",
      description: `Error: ${error.message}`,
      duration: 3000,
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Deletes a scheduled file
 */
export const deleteScheduledFile = async (id: string): Promise<void> => {
  try {
    const { data, error } = await supabaseUnsafe
      .from("scheduled_files")
      .select("storage_path")
      .eq("id", id)
      .single();
      
    if (error) {
      toast({
        title: "Delete Error",
        description: `Failed to delete file: ${error.message}`,
        duration: 3000,
        variant: "destructive"
      });
      throw error;
    }
    
    if (data?.storage_path) {
      const { error: storageError } = await supabase
        .storage
        .from("timecapsule")
        .remove([data.storage_path]);

      if (storageError) {
        console.error("Error removing file from storage:", storageError);
      }
    }
    
    const { error: dbError } = await supabaseUnsafe
      .from("scheduled_files")
      .delete()
      .eq("id", id);
      
    if (dbError) {
      toast({
        title: "Delete Error",
        description: `Failed to delete record: ${dbError.message}`,
        duration: 3000,
        variant: "destructive"
      });
      throw dbError;
    }
    
    toast({
      title: "Success",
      description: "File deleted successfully",
      duration: 3000
    });
  } catch (error: any) {
    console.error("Error deleting scheduled file:", error);
    toast({
      title: "Delete Error",
      description: `Error deleting scheduled file: ${error.message}`,
      duration: 3000,
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Gets all scheduled files for the current user
 */
export const getScheduledFiles = async (): Promise<FileItem[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated",
        duration: 3000
      });
      return [];
    }

    const { data, error } = await supabaseUnsafe
      .from("scheduled_files")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
      
    if (error) {
      toast({
        title: "Fetch Error",
        description: `Failed to fetch files: ${error.message}`,
        duration: 3000,
        variant: "destructive"
      });
      throw error;
    }
    
    return data.map((item: any) => ({
      id: item.id,
      name: item.file_name,
      size: item.file_size,
      type: item.file_type,
      recipient: item.recipient_email,
      scheduledDate: new Date(item.scheduled_date),
      status: item.status as "pending" | "sent" | "failed",
      createdAt: new Date(item.created_at),
      access_token: item.access_token,
      storage_path: item.storage_path
    }));
  } catch (error: any) {
    console.error("Error fetching scheduled files:", error);
    toast({
      title: "Fetch Error",
      description: `Error fetching scheduled files: ${error.message}`,
      duration: 3000,
      variant: "destructive"
    });
    return [];
  }
};
