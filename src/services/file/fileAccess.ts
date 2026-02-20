
import { supabase } from "@/integrations/supabase/client";

export const getFileByToken = async (token: string): Promise<{
  fileName: string;
  fileType: string;
  fileUrl: string;
} | null> => {
  try {
    console.log("Fetching file with token:", token);
    
    const { data, error } = await supabase
      .from("scheduled_files")
      .select("*")
      .eq("access_token", token)
      .single();
      
    if (error || !data) {
      console.error("Error fetching file by token:", error);
      return null;
    }
    
    console.log("File data found in database:", data);
    
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from("timecapsule")
      .createSignedUrl(data.storage_path, 60 * 60 * 24); // 24 hours
      
    if (fileError || !fileData) {
      console.error("Error creating signed URL:", fileError);
      return null;
    }
    
    console.log("Signed URL created successfully:", fileData.signedUrl);
    
    if (data.status === 'pending') {
      try {
        const { error: updateError } = await supabase
          .from("scheduled_files")
          .update({ 
            status: "sent",
            sent_at: new Date().toISOString() 
          })
          .eq("id", data.id);
        
        if (updateError) {
          console.error("Error updating file status:", updateError);
        } else {
          console.log("Updated file status to 'sent'");
        }
      } catch (updateErr) {
        console.error("Exception updating file status:", updateErr);
      }
    }
    
    return {
      fileName: data.file_name,
      fileType: data.file_type,
      fileUrl: fileData.signedUrl
    };
  } catch (error: any) {
    console.error("Error in getFileByToken:", error);
    return null;
  }
};
