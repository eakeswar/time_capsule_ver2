import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { persistSession: false } }
);

const APP_URL = Deno.env.get("APP_URL") || "https://limzhusojiirnsefkupe.lovable.app";
console.log(`Using APP_URL: ${APP_URL}`);

const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";

if (!SMTP_USER || !SMTP_PASS) {
  console.error("SMTP_USER or SMTP_PASS is not set in environment variables");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function logWithTimestamp(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] [DATA]`, JSON.stringify(data, null, 2));
  }
}

async function sendEmailViaSMTP(to: string, subject: string, htmlBody: string): Promise<{ success: boolean; error?: string }> {
  const client = new SmtpClient();

  try {
    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 465,
      username: SMTP_USER,
      password: SMTP_PASS,
    });

    await client.send({
      from: SMTP_USER,
      to: to,
      subject: subject,
      content: "Please view this email in an HTML-capable email client.",
      html: htmlBody,
    });

    await client.close();
    return { success: true };
  } catch (error: any) {
    logWithTimestamp('error', 'SMTP send error', { message: error.message, stack: error.stack });
    try { await client.close(); } catch (_) { /* ignore close errors */ }
    return { success: false, error: error.message || "Unknown SMTP error" };
  }
}

function generateAccessUrl(accessToken: string): string {
  const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
  return `${baseUrl}/access/${accessToken}`;
}

async function processScheduledFiles(specificFileId?: string): Promise<{ success: number; failed: number; processed: number }> {
  let successCount = 0;
  let failedCount = 0;
  let processedCount = 0;

  try {
    logWithTimestamp('info', 'Starting to process scheduled files', { specificFileId, currentTime: new Date().toISOString() });

    let query = supabaseClient.from("scheduled_files").select("*").eq("status", "pending");

    if (specificFileId) {
      query = query.eq("id", specificFileId);
    } else {
      query = query.lte("scheduled_date", new Date().toISOString());
      logWithTimestamp('info', `Processing all pending files due before: ${new Date().toISOString()}`);
    }

    const { data: scheduledFiles, error: selectError } = await query;

    if (selectError) {
      logWithTimestamp('error', 'Error fetching scheduled files', selectError);
      return { success: 0, failed: 0, processed: 0 };
    }

    if (!scheduledFiles || scheduledFiles.length === 0) {
      logWithTimestamp('info', 'No scheduled files found to process');
      return { success: 0, failed: 0, processed: 0 };
    }

    logWithTimestamp('info', `Found ${scheduledFiles.length} files to process`);
    processedCount = scheduledFiles.length;

    for (const file of scheduledFiles) {
      try {
        logWithTimestamp('info', `Processing file ${file.id}`, {
          fileName: file.file_name,
          recipient: file.recipient_email,
          scheduledDate: file.scheduled_date,
        });

        // Mark as processing
        await supabaseClient
          .from("scheduled_files")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("id", file.id)
          .eq("status", "pending");

        const accessUrl = generateAccessUrl(file.access_token);
        logWithTimestamp('info', `Generated access URL for file ${file.id}`, { accessUrl });

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #4F46E5;">Time Capsule</h2>
            <p>Hi there,</p>
            <p>You've received a scheduled file through <strong>Time Capsule</strong>.</p>
            <p>🔗 Click the link below to access your file:</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${accessUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">👉 Access Your File</a>
            </div>
            <p>If the button doesn't work, copy and paste this link: ${accessUrl}</p>
            <p>Thanks,<br>— The Time Capsule Team</p>
          </div>`;

        if (!SMTP_USER || !SMTP_PASS) {
          throw new Error("SMTP credentials are not configured");
        }

        const emailResult = await sendEmailViaSMTP(
          file.recipient_email,
          "Your TimeCapsule File is Ready!",
          emailHtml
        );

        if (emailResult.success) {
          logWithTimestamp('info', `Email sent successfully for file ${file.id}`);
          await supabaseClient
            .from("scheduled_files")
            .update({ status: "sent", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("id", file.id);
          successCount++;
        } else {
          logWithTimestamp('error', `Email failed for file ${file.id}`, { error: emailResult.error });
          await supabaseClient
            .from("scheduled_files")
            .update({ status: "failed", error_message: emailResult.error || "SMTP error", updated_at: new Date().toISOString() })
            .eq("id", file.id);
          failedCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        logWithTimestamp('error', `Error processing file ${file.id}`, { message: error.message });
        failedCount++;
        await supabaseClient
          .from("scheduled_files")
          .update({ status: "failed", error_message: error.message || "Unknown error", updated_at: new Date().toISOString() })
          .eq("id", file.id);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    logWithTimestamp('info', 'Completed processing', { success: successCount, failed: failedCount, processed: processedCount });
    return { success: successCount, failed: failedCount, processed: processedCount };
  } catch (error) {
    logWithTimestamp('error', 'Error in processScheduledFiles', error);
    return { success: 0, failed: processedCount, processed: processedCount };
  }
}

serve(async (req) => {
  const requestStart = new Date();
  logWithTimestamp('info', '=== SEND SCHEDULED FILE REQUEST ===', { method: req.method, url: req.url });

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let specificFileId: string | undefined;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        specificFileId = body.fileId;
      } catch { /* no body */ }
    }

    const result = await processScheduledFiles(specificFileId);

    return new Response(JSON.stringify({
      ...result,
      timestamp: new Date().toISOString(),
      duration: `${Date.now() - requestStart.getTime()}ms`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logWithTimestamp('error', 'Edge Function error', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
