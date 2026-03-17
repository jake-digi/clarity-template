import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ORIGIN = "https://orders.freemansindustrial.co.uk";
const INVITE_FROM_EMAIL = "Freemans Industrial <accounts@orders.freemansindustrial.co.uk>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(decoded) as { sub?: string }).sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sub = getJwtSub(authHeader);
    if (!sub) return json({ error: "Invalid token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is an admin
    const { data: caller } = await adminClient
      .from("portal_users")
      .select("id, is_admin")
      .eq("auth_id", sub)
      .single();
    if (!caller) return json({ error: "User not found" }, 403);
    if (!caller.is_admin) return json({ error: "Admin access required" }, 403);

    const resendKey = Deno.env.get("RESEND_API_KEY");

    const body = await req.json();
    const { action, portal_user_id, customer_id, name: newName, role, is_admin: newIsAdmin } = body;

    if (!action || !portal_user_id) {
      return json({ error: "action and portal_user_id are required" }, 400);
    }

    // Fetch the target user's portal record
    const { data: target, error: fetchErr } = await adminClient
      .from("portal_users")
      .select("id, auth_id, email, name, role, is_admin")
      .eq("id", portal_user_id)
      .single();

    if (fetchErr || !target) return json({ error: "User not found" }, 404);

    // Prevent self-modification
    if (target.auth_id === sub) {
      return json({ error: "You cannot modify your own account" }, 400);
    }

    switch (action) {
      case "disable": {
        // Ban in Supabase auth (effectively prevents sign-in)
        if (target.auth_id) {
          const { error: banErr } = await adminClient.auth.admin.updateUserById(
            target.auth_id,
            { ban_duration: "876600h" }, // ~100 years
          );
          if (banErr) return json({ error: banErr.message }, 500);
        }
        const { error: dbErr } = await adminClient
          .from("portal_users")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", portal_user_id);
        if (dbErr) return json({ error: dbErr.message }, 500);
        return json({ success: true, action: "disabled" });
      }

      case "enable": {
        if (target.auth_id) {
          const { error: unbanErr } = await adminClient.auth.admin.updateUserById(
            target.auth_id,
            { ban_duration: "none" },
          );
          if (unbanErr) return json({ error: unbanErr.message }, 500);
        }
        const { error: dbErr } = await adminClient
          .from("portal_users")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("id", portal_user_id);
        if (dbErr) return json({ error: dbErr.message }, 500);
        return json({ success: true, action: "enabled" });
      }

      case "delete": {
        // Delete portal record first, then auth user
        const { error: dbErr } = await adminClient
          .from("portal_users")
          .delete()
          .eq("id", portal_user_id);
        if (dbErr) return json({ error: dbErr.message }, 500);

        if (target.auth_id) {
          // Non-fatal if auth deletion fails — record is already gone
          await adminClient.auth.admin.deleteUser(target.auth_id);
        }
        return json({ success: true, action: "deleted" });
      }

      case "change_customer": {
        const { error: dbErr } = await adminClient
          .from("portal_users")
          .update({ customer_id: customer_id ?? null, updated_at: new Date().toISOString() })
          .eq("id", portal_user_id);
        if (dbErr) return json({ error: dbErr.message }, 500);
        return json({ success: true, action: "customer_changed" });
      }

      case "set_permissions": {
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (typeof role === "string") updates.role = role;
        if (typeof newIsAdmin === "boolean") updates.is_admin = newIsAdmin;

        if (Object.keys(updates).length === 1) {
          return json({ error: "No permission changes supplied" }, 400);
        }

        const { error: dbErr } = await adminClient
          .from("portal_users")
          .update(updates)
          .eq("id", portal_user_id);
        if (dbErr) return json({ error: dbErr.message }, 500);
        return json({
          success: true,
          action: "permissions_updated",
          role: updates.role ?? target.role,
          is_admin: updates.is_admin ?? target.is_admin,
        });
      }

      case "rename": {
        if (!newName?.trim()) return json({ error: "name is required" }, 400);
        const { error: dbErr } = await adminClient
          .from("portal_users")
          .update({ name: newName.trim(), updated_at: new Date().toISOString() })
          .eq("id", portal_user_id);
        if (dbErr) return json({ error: dbErr.message }, 500);
        // Also update auth user metadata so the name is consistent
        if (target.auth_id) {
          await adminClient.auth.admin.updateUserById(target.auth_id, {
            user_metadata: { name: newName.trim() },
          });
        }
        return json({ success: true, action: "renamed" });
      }

      case "reset_password": {
        if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: target.email,
          options: { redirectTo: `${DEFAULT_ORIGIN}/reset-password` },
        });
        if (linkErr) return json({ error: linkErr.message }, 500);

        // Extract token_hash and build direct link on our domain
        const rawLink = linkData?.properties?.action_link ?? "";
        const resetLink = (() => {
          try {
            const url = new URL(rawLink);
            const tokenHash = url.searchParams.get("token");
            if (tokenHash) {
              return `${DEFAULT_ORIGIN}/reset-password?token_hash=${tokenHash}&type=recovery`;
            }
            return rawLink;
          } catch {
            return rawLink;
          }
        })();

        const userName = target.name ?? target.email;
        const year = new Date().getFullYear();

        const emailHtml = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Reset your password</title></head>
<body style="margin: 0; padding: 0; background-color: #e8eaed; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #e8eaed;">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width: 560px; width: 100%;">
        <tr><td style="background-color: #1a1f2e; padding: 32px 40px; border-radius: 8px 8px 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="color: #ffffff; font-size: 18px; font-weight: 700;">Freemans Industrial Supplies</td></tr>
            <tr><td style="padding-top: 12px; color: #cbd5e0; font-size: 22px; font-weight: 600; line-height: 1.3;">Password reset request</td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color: #f5a623; height: 4px; font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
        <tr><td style="background-color: #ffffff; padding: 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="color: #1a1f2e; font-size: 16px; font-weight: 600; padding-bottom: 16px;">Hi ${userName},</td></tr>
            <tr><td style="color: #4a5568; font-size: 15px; line-height: 1.6; padding-bottom: 12px;">A password reset has been requested for your Freemans Industrial Supplies account. Click the button below to set a new password.</td></tr>
            <tr><td style="color: #4a5568; font-size: 13px; line-height: 1.5; padding-bottom: 28px;">This link is valid for 24 hours. If you didn't request a password reset, you can safely ignore this email.</td></tr>
            <tr><td align="center" style="padding-bottom: 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="center" style="background-color: #1a1f2e; border-radius: 6px;">
                  <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px;">Reset my password &#8594;</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="color: #a0aec0; font-size: 13px; line-height: 1.5;">Questions? Contact us at <a href="mailto:accounts@orders.freemansindustrial.co.uk" style="color: #a0aec0; text-decoration: underline;">accounts@orders.freemansindustrial.co.uk</a></td></tr>
          </table>
        </td></tr>
        <tr><td style="background-color: #f7f8fa; padding: 24px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="color: #a0aec0; font-size: 12px; line-height: 1.6; text-align: center;">
              <span style="color: #1a1f2e; font-weight: 600;">Freemans Industrial Supplies Ltd</span><br />
              &copy; ${year} All rights reserved.<br />
              <a href="https://orders.freemansindustrial.co.uk" style="color: #a0aec0; text-decoration: underline;">orders.freemansindustrial.co.uk</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: INVITE_FROM_EMAIL,
            to: [target.email],
            subject: "Reset your Freemans Industrial Supplies password",
            html: emailHtml,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          return json({ success: false, error: errBody });
        }
        return json({ success: true, action: "reset_password_sent" });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e: any) {
    console.error("manage-user error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
