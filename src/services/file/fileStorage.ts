
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Uploads a file to the Supabase storage
 */
export const uploadFile = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase
    .storage
    .from("timecapsule")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });
    
  if (error) {
    console.error("Error uploading file:", error);
    toast("Upload Error", {
      description: `Failed to upload file: ${error.message}`,
      duration: 3000,
      style: { backgroundColor: 'rgb(var(--color-destructive))' }
    });
    throw error;
  }
  
  return data.path;
};

/**
 * Gets a preview URL for a file 
 */
export const getFilePreviewUrl = async (storagePath: string): Promise<string | null> => {
  if (!storagePath) return null;
  
  try {
    const { data, error } = await supabase
      .storage
      .from("timecapsule")
      .createSignedUrl(storagePath, 60 * 5); // 5 minutes
      
    if (error || !data) {
      console.error("Error creating signed URL for preview:", error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting file preview URL:", error);
    return null;
  }
};

/**
 * Gets a file preview by storage path
 */
export const getFilePreviewByStoragePath = async (storagePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .storage
      .from("timecapsule")
      .createSignedUrl(storagePath, 60 * 5); // 5 minutes expiry
      
    if (error) {
      console.error("Error creating signed URL for file preview:", error);
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error("Error getting file preview by storage path:", error);
    return null;
  }
};
