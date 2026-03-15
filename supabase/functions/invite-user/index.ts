import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Resend: from address must use a verified domain (e.g. checkpoint.jlgb.org in Resend dashboard)
const INVITE_FROM_EMAIL = "Checkpoint <noreply@checkpoint.jlgb.org>";
const DEFAULT_ORIGIN = "https://checkpoint.jlgb.org";
const CHECKPOINT_LOGO_URL = "https://checkpoint.jlgb.org/checkpoint-logo.png";
const JLGB_LOGO_URL = "https://www.jlgb.org/components/com_jlgb/assets/JLGB_logo_BYBS_navy_notagline_315x215.png";

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

/** Decode JWT payload and return sub claim. Works with Auth0 and Supabase JWTs. */
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

type InviteType = "checkpoint" | "developer";

function buildInviteEmailHtml(
  firstName: string,
  resetLink: string,
  inviteType: InviteType
): string {
  const isDeveloper = inviteType === "developer";

  const accentColor = isDeveloper ? "#4338ca" : "#0a2422";
  const accentColorLight = isDeveloper ? "#6366f1" : "#1a5340";
  const productName = isDeveloper ? "CheckPoint Developer" : "Checkpoint";
  const tagline = isDeveloper
    ? "the API and developer platform for Checkpoint"
    : "the operations management platform for your team";
  const footerText = isDeveloper
    ? `© ${new Date().getFullYear()} CheckPoint Developer · API Platform`
    : `© ${new Date().getFullYear()} Checkpoint · Operations Dashboard`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${productName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <!-- Header with logos -->
          <tr>
            <td style="padding: 36px 40px 28px 40px; background-color: #ffffff; text-align: center; border-bottom: 3px solid ${accentColor};">
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
          <!-- Main content -->
          <tr>
            <td style="padding: 36px 40px 32px 40px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: ${accentColor}; letter-spacing: -0.02em;">
                Welcome to ${productName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #64748b;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                You've been invited to join ${productName} — ${tagline}. Click the button below to set your password and get started.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: ${accentColor}; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Set your password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 28px 0 0 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #e2e8f0; background-color: #f8fafc;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ${footerText}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
                <a href="https://checkpoint.jlgb.org" style="color: ${accentColorLight}; text-decoration: none;">checkpoint.jlgb.org</a>
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
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

    // Extract sub from JWT (supports Auth0 and Supabase JWTs)
    const sub = getJwtSub(authHeader);
    if (!sub) return json({ error: "Invalid or expired token. Please sign in again." }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: callerUser } = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("auth_id", sub)
      .single();
    if (!callerUser) return json({ error: "User record not found. Your account may not be synced." }, 403);

    const { email, first_name, last_name, role_id, invite_type } = await req.json();
    if (!email || !first_name) return json({ error: "email and first_name are required" }, 400);
    const inviteType: InviteType = invite_type === "developer" ? "developer" : "checkpoint";

    let authUserId: string;

    // Create the auth user (or use existing if already registered)
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: newAuth, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });

    if (createErr) {
      const isAlreadyRegistered = createErr.message?.includes("already been registered") || createErr.message?.includes("already exists");
      if (!isAlreadyRegistered) return json({ error: createErr.message }, 400);
      // User exists in auth — send invite anyway (generateLink works with email)
      authUserId = ""; // Not needed for generateLink
    } else {
      authUserId = newAuth!.user.id;
      const newUserId = crypto.randomUUID();
      const { error: insertErr } = await adminClient.from("users").insert({
        id: newUserId,
        auth_id: authUserId,
        email,
        first_name,
        last_name: last_name || null,
        surname: last_name || null,
        tenant_id: callerUser.tenant_id,
        status: "active",
      });
      if (insertErr) {
        const isDuplicate = insertErr.message?.includes("duplicate key") || insertErr.message?.includes("unique constraint");
        if (!isDuplicate) return json({ error: insertErr.message || "Failed to create user record" }, 500);
        // User already in public.users (e.g. from partial previous run) — continue to send email
      } else if (role_id) {
        await adminClient.from("user_role_assignments").insert({
          user_id: newUserId,
          role_id,
        });
      }
    }

    // Generate password reset link for the invite (always use production URL so links work from email)
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${DEFAULT_ORIGIN}/reset-password` },
    });
    if (linkErr) return json({ error: linkErr.message || "Failed to generate invite link" }, 500);

    const resetLink = linkData?.properties?.action_link || "";

    // Send invite email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: INVITE_FROM_EMAIL,
        to: [email],
        subject: inviteType === "developer"
          ? "You've been invited to CheckPoint Developer"
          : "You've been invited to Checkpoint",
        html: buildInviteEmailHtml(first_name, resetLink, inviteType),
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return json({ success: true, user_id: authUserId, email_sent: false, email_error: errBody });
    }

    return json({ success: true, user_id: authUserId, email_sent: true });
  } catch (e) {
    console.error("invite-user error:", e);
    return json({ error: e.message }, 500);
  }
});
