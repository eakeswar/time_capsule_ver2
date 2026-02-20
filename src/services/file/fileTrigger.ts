
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess, logDebug } from "@/utils/errorHandler";

/**
 * Triggers the sending of scheduled files
 */
export const triggerFileSending = async (): Promise<any> => {
  try {
    // Show loading toast
    handleSuccess("Processing scheduled files...", {
      title: "Processing",
      duration: 2000
    });
    
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-scheduled-file`;
    logDebug("Calling send-scheduled-file function", "file-trigger", { url: functionUrl });
    
    const { data: authData } = await supabase.auth.getSession();
    const accessToken = authData.session?.access_token;
    
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken ? `Bearer ${accessToken}` : "",
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logDebug("Error response from send-scheduled-file", "file-trigger", errorText);
      throw new Error(`Failed to trigger: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logDebug("File sending result", "file-trigger", data);
    
    handleSuccess(`Processed ${data.processed || 0} files`, {
      context: "file-trigger"
    });
    
    // Refresh the file list after processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    window.dispatchEvent(new CustomEvent('refresh-file-list'));
    
    return data;
  } catch (error: any) {
    handleError(error, "Failed to process files", {
      context: "file-trigger"
    });
    
    throw error;
  }
};
