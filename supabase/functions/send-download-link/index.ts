import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INVITE_FROM_EMAIL = "JLGB Checkpoint <noreply@checkpoint.jlgb.org>";
const CHECKPOINT_LOGO_URL = "https://checkpoint.jlgb.org/checkpoint-logo.png";
const JLGB_LOGO_URL = "https://www.jlgb.org/components/com_jlgb/assets/JLGB_logo_BYBS_navy_notagline_315x215.png";
const APPLE_STORE_URL = "https://apps.apple.com/app/checkpoint/id000000000";
const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=org.jlgb.checkpoint";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getJwtSub(authHeader: string): string | null {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded) as { sub?: string };
    return parsed.sub ?? null;
  } catch {
    return null;
  }
}

function buildDownloadLinkEmailHtml(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download Checkpoint App</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <tr>
            <td style="padding: 36px 40px 28px 40px; background-color: #ffffff; text-align: center; border-bottom: 3px solid #0a2422;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 12px; vertical-align: middle;">
                    <img src="${CHECKPOINT_LOGO_URL}" alt="Checkpoint" width="140" height="42" style="display: block; max-width: 140px; height: auto;" />
                  </td>
                  <td style="padding: 0 12px; vertical-align: middle; border-left: 1px solid #e2e8f0;">
                    <img src="${JLGB_LOGO_URL}" alt="JLGB" width="72" height="49" style="display: block; max-width: 72px; height: auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 32px 40px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #0a2422; letter-spacing: -0.02em;">
                Download the Checkpoint App
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Get the Checkpoint app on your phone to manage operations on the go. Choose your platform below.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${APPLE_STORE_URL}" style="display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Download on the App Store
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 8px 0;">
                    <a href="${ANDROID_STORE_URL}" style="display: inline-block; padding: 14px 28px; background-color: #0a2422; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Get it on Google Play
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 28px 0 0 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                Or scan the QR code from the Checkpoint dashboard to download.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                © ${new Date().getFullYear()} Checkpoint · Operations Dashboard
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
                <a href="https://checkpoint.jlgb.org" style="color: #1a5340; text-decoration: none;">checkpoint.jlgb.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

    const sub = getJwtSub(authHeader);
    if (!sub) return json({ error: "Invalid or expired token. Please sign in again." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: callerUser } = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("auth_id", sub)
      .single();
    if (!callerUser) return json({ error: "User record not found. Your account may not be synced." }, 403);

    const { emails } = await req.json();
    const list = Array.isArray(emails) ? emails : typeof emails === "string" ? [emails] : [];
    const validEmails = list
      .map((e: string) => (e || "").trim().toLowerCase())
      .filter((e: string) => e && e.includes("@"));

    if (validEmails.length === 0) {
      return json({ error: "At least one valid email address is required." }, 400);
    }

    const html = buildDownloadLinkEmailHtml();
    const results: { email: string; ok: boolean; error?: string }[] = [];

    for (const email of validEmails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: INVITE_FROM_EMAIL,
          to: [email],
          subject: "Download the Checkpoint App",
          html,
        }),
      });

      if (res.ok) {
        results.push({ email, ok: true });
      } else {
        const errBody = await res.text();
        results.push({ email, ok: false, error: errBody });
      }
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);

    return json({
      success: true,
      sent,
      total: validEmails.length,
      failed: failed.length,
      results,
    });
  } catch (e) {
    console.error("send-download-link error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
