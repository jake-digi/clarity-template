import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Resend: from address must use a verified domain (e.g. checkpoint.jlgb.org in Resend dashboard)
const INVITE_FROM_EMAIL = "Checkpoint <noreply@checkpoint.jlgb.org>";
const DEFAULT_ORIGIN = "https://checkpoint.jlgb.org";
const LOGO_URL = "https://checkpoint.jlgb.org/checkpoint-logo.png";

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

function buildInviteEmailHtml(firstName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Checkpoint</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <!-- Header with logo -->
          <tr>
            <td style="padding: 36px 40px 28px 40px; background-color: #ffffff; text-align: center; border-bottom: 3px solid #0a2422;">
              <img src="${LOGO_URL}" alt="Checkpoint" width="180" height="54" style="display: inline-block; max-width: 180px; height: auto; vertical-align: middle;" />
            </td>
          </tr>
          <!-- Main content -->
          <tr>
            <td style="padding: 36px 40px 32px 40px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #0a2422; letter-spacing: -0.02em;">
                Welcome to Checkpoint
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #64748b;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                You've been invited to join Checkpoint — the operations management platform for your team. Click the button below to set your password and get started.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #0a2422; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
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
    // Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

    // Verify the calling user is authenticated
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !caller) {
      const msg = authErr?.message ?? "Invalid or expired session. Please sign in again.";
      return json({ error: msg }, 401);
    }

    // Get caller's tenant
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: callerUser } = await adminClient
      .from("users")
      .select("tenant_id")
      .eq("auth_id", caller.id)
      .single();
    if (!callerUser) return json({ error: "User record not found" }, 403);

    const { email, first_name, last_name, role_id } = await req.json();
    if (!email || !first_name) return json({ error: "email and first_name are required" }, 400);

    // Create the auth user with a temp password (they'll reset via invite link)
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: newAuth, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name },
    });
    if (createErr) {
      const msg = createErr.message?.includes("already been registered") || createErr.message?.includes("already exists")
        ? "A user with this email is already registered."
        : createErr.message;
      return json({ error: msg }, 400);
    }

    // Create user record in users table
    const newUserId = crypto.randomUUID();
    const { error: insertErr } = await adminClient.from("users").insert({
      id: newUserId,
      auth_id: newAuth.user.id,
      email,
      first_name,
      last_name: last_name || null,
      surname: last_name || null,
      tenant_id: callerUser.tenant_id,
      status: "active",
    });
    if (insertErr) return json({ error: insertErr.message || "Failed to create user record" }, 500);

    // Assign role if provided
    if (role_id) {
      await adminClient.from("user_role_assignments").insert({
        user_id: newUserId,
        role_id,
      });
    }

    // Generate password reset link for the invite
    const origin = req.headers.get("origin") || DEFAULT_ORIGIN;
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
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
        subject: "You've been invited to Checkpoint",
        html: buildInviteEmailHtml(first_name, resetLink),
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      // User was still created, just email failed
      return json({ success: true, user_id: newUserId, email_sent: false, email_error: errBody });
    }

    return json({ success: true, user_id: newUserId, email_sent: true });
  } catch (e) {
    console.error("invite-user error:", e);
    return json({ error: e.message }, 500);
  }
});
