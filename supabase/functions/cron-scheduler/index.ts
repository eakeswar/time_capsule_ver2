
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced logging function
function logWithTimestamp(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] [DATA]`, JSON.stringify(data, null, 2));
  }
}

// Log to send_logs table
async function logToDatabase(fileId: string, status: 'attempt' | 'success' | 'error', details: any) {
  try {
    const { error } = await supabase
      .from('send_logs')
      .insert({
        file_id: fileId,
        status: status,
        details: details,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      logWithTimestamp('error', 'Failed to log to send_logs table', error);
    }
  } catch (err) {
    logWithTimestamp('error', 'Exception logging to database', err);
  }
}

// Process pending files function with enhanced logging
async function processPendingFiles() {
  const startTime = new Date();
  logWithTimestamp('info', '=== STARTING SCHEDULED FILE PROCESSING ===', {
    startTime: startTime.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  try {
    // Step 1: Query for pending files with detailed logging
    logWithTimestamp('info', 'Querying for pending files...');
    
    const currentTime = new Date();
    const { data: pendingFiles, error: queryError } = await supabase
      .from("scheduled_files")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_date", currentTime.toISOString());
    
    if (queryError) {
      logWithTimestamp('error', 'Database query failed', queryError);
      return { error: queryError.message, processed: 0, success: 0, failed: 0 };
    }
    
    logWithTimestamp('info', `Query completed. Found ${pendingFiles?.length || 0} pending files`, {
      currentTime: currentTime.toISOString(),
      queryFilter: {
        status: 'pending',
        scheduled_date_lte: currentTime.toISOString()
      }
    });

    // Step 2: Log each file found (or lack thereof)
    if (!pendingFiles || pendingFiles.length === 0) {
      logWithTimestamp('info', 'No pending files found to process');
      
      // Also check total pending files for debugging
      const { data: allPending } = await supabase
        .from("scheduled_files")
        .select("id, scheduled_date, status")
        .eq("status", "pending");
      
      logWithTimestamp('debug', `Total pending files in database: ${allPending?.length || 0}`, allPending);
      
      return { message: "No pending files to process", processed: 0, success: 0, failed: 0 };
    }

    // Log details of each file found
    pendingFiles.forEach((file, index) => {
      const timeDiff = currentTime.getTime() - new Date(file.scheduled_date).getTime();
      logWithTimestamp('info', `File ${index + 1}/${pendingFiles.length}`, {
        id: file.id,
        fileName: file.file_name,
        recipientEmail: file.recipient_email,
        scheduledDate: file.scheduled_date,
        timePastDue: `${Math.round(timeDiff / 1000)} seconds`,
        status: file.status
      });
    });

    let successCount = 0;
    let failedCount = 0;

    // Step 3: Process each file with comprehensive logging
    for (const file of pendingFiles) {
      const fileProcessStart = new Date();
      logWithTimestamp('info', `Processing file: ${file.id}`, {
        fileName: file.file_name,
        recipient: file.recipient_email,
        startTime: fileProcessStart.toISOString()
      });

      // Log attempt to database
      await logToDatabase(file.id, 'attempt', {
        fileName: file.file_name,
        recipient: file.recipient_email,
        scheduledDate: file.scheduled_date
      });

      try {
        // Step 3a: Update status to processing to prevent duplicates
        logWithTimestamp('info', `Updating file ${file.id} status to 'processing'`);
        
        const { error: updateError } = await supabase
          .from("scheduled_files")
          .update({ 
            status: "processing",
            updated_at: new Date().toISOString()
          })
          .eq("id", file.id)
          .eq("status", "pending"); // Only update if still pending
          
        if (updateError) {
          logWithTimestamp('error', `Failed to update status to processing for file ${file.id}`, updateError);
          // Continue anyway but log the issue
        } else {
          logWithTimestamp('info', `Successfully updated file ${file.id} to processing status`);
        }

        // Step 3b: Call send-scheduled-file function
        logWithTimestamp('info', `Calling send-scheduled-file function for file ${file.id}`);
        
        const sendFunctionUrl = `${supabaseUrl}/functions/v1/send-scheduled-file`;
        const sendResponse = await fetch(sendFunctionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ fileId: file.id }) // Pass specific file ID
        });

        if (!sendResponse.ok) {
          const errorText = await sendResponse.text();
          logWithTimestamp('error', `Send function failed for file ${file.id}`, {
            status: sendResponse.status,
            statusText: sendResponse.statusText,
            error: errorText
          });
          
          // Update to failed status
          await supabase
            .from("scheduled_files")
            .update({ 
              status: "failed",
              error_message: `Send function failed: ${sendResponse.status} ${sendResponse.statusText}`,
              updated_at: new Date().toISOString()
            })
            .eq("id", file.id);

          await logToDatabase(file.id, 'error', {
            error: `Send function failed: ${sendResponse.status}`,
            details: errorText
          });

          failedCount++;
          continue;
        }

        const sendResult = await sendResponse.json();
        logWithTimestamp('info', `Send function completed for file ${file.id}`, sendResult);

        // Step 3c: Verify the file was actually sent by checking its current status
        const { data: updatedFile } = await supabase
          .from("scheduled_files")
          .select("status, email_id, sent_at, error_message")
          .eq("id", file.id)
          .single();

        if (updatedFile) {
          logWithTimestamp('info', `File ${file.id} final status check`, {
            status: updatedFile.status,
            emailId: updatedFile.email_id,
            sentAt: updatedFile.sent_at,
            errorMessage: updatedFile.error_message
          });

          if (updatedFile.status === 'sent' && updatedFile.email_id) {
            successCount++;
            await logToDatabase(file.id, 'success', {
              emailId: updatedFile.email_id,
              sentAt: updatedFile.sent_at
            });
            logWithTimestamp('info', `✅ File ${file.id} successfully sent with email ID: ${updatedFile.email_id}`);
          } else {
            failedCount++;
            await logToDatabase(file.id, 'error', {
              finalStatus: updatedFile.status,
              errorMessage: updatedFile.error_message
            });
            logWithTimestamp('error', `❌ File ${file.id} failed to send`, {
              finalStatus: updatedFile.status,
              errorMessage: updatedFile.error_message
            });
          }
        } else {
          logWithTimestamp('error', `Could not verify final status for file ${file.id}`);
          failedCount++;
        }

        // Add delay between files to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        logWithTimestamp('error', `Exception processing file ${file.id}`, error);
        failedCount++;

        // Update file status to failed
        try {
          await supabase
            .from("scheduled_files")
            .update({ 
              status: "failed",
              error_message: error.message || "Processing exception occurred",
              updated_at: new Date().toISOString()
            })
            .eq("id", file.id);

          await logToDatabase(file.id, 'error', {
            error: error.message,
            stack: error.stack
          });
        } catch (updateErr) {
          logWithTimestamp('error', `Failed to update error status for file ${file.id}`, updateErr);
        }
      }
    }

    // Step 4: Final summary
    const endTime = new Date();
    const processingDuration = endTime.getTime() - startTime.getTime();
    
    const summary = {
      processed: pendingFiles.length,
      success: successCount,
      failed: failedCount,
      duration: `${processingDuration}ms`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };

    logWithTimestamp('info', '=== PROCESSING COMPLETED ===', summary);

    return summary;
  } catch (error: any) {
    logWithTimestamp('error', 'Fatal error in processPendingFiles', error);
    return { 
      error: error.message || "Unknown error in processPendingFiles",
      processed: 0,
      success: 0,
      failed: 0
    };
  }
}

// Main handler
serve(async (req) => {
  const requestStart = new Date();
  logWithTimestamp('info', `=== CRON SCHEDULER REQUEST ===`, {
    method: req.method,
    url: req.url,
    timestamp: requestStart.toISOString()
  });

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const result = await processPendingFiles();
    
    const response = {
      success: true,
      message: "Cron job executed successfully",
      result,
      timestamp: new Date().toISOString(),
      duration: `${new Date().getTime() - requestStart.getTime()}ms`
    };

    logWithTimestamp('info', 'Cron job completed successfully', response);
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    logWithTimestamp('error', 'Fatal error in cron scheduler', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
