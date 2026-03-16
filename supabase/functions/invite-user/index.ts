import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INVITE_FROM_EMAIL = "Freemans Industrial <accounts@orders.freemansindustrial.co.uk>";
const DEFAULT_ORIGIN = "https://orders.freemansindustrial.co.uk";

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
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded) as { sub?: string };
    return parsed.sub ?? null;
  } catch {
    return null;
  }
}

function applyTemplateVars(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    html,
  );
}

// Fallback used only if the DB template cannot be loaded
function fallbackHtml(name: string, resetLink: string): string {
  return applyTemplateVars(
    `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><title>Welcome</title></head>
<body style="font-family:Arial,sans-serif;padding:40px;background:#e8eaed;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
<div style="background:#1a1f2e;padding:32px 40px;color:#fff;font-size:20px;font-weight:700;">Freemans Industrial Supplies</div>
<div style="padding:40px;">
<p style="font-size:16px;font-weight:600;color:#1a1f2e;">Hi {{name}},</p>
<p style="color:#4a5568;font-size:15px;line-height:1.6;">An account has been created for you on the Freemans Industrial Supplies ordering platform. Click below to set your password.</p>
<p style="margin-top:24px;"><a href="{{reset_link}}" style="display:inline-block;padding:14px 32px;background:#1a1f2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Set your password &rarr;</a></p>
</div>
<div style="background:#f7f8fa;padding:24px 40px;text-align:center;font-size:12px;color:#a0aec0;">&copy; {{year}} Freemans Industrial Supplies Ltd</div>
</div></body></html>`,
    { name, reset_link: resetLink, year: String(new Date().getFullYear()) },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "RESEND_API_KEY not configured" }, 500);

    const sub = getJwtSub(authHeader);
    if (!sub) return json({ error: "Invalid or expired token. Please sign in again." }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify caller is an admin
    const { data: callerUser } = await adminClient
      .from("portal_users")
      .select("id, is_admin")
      .eq("auth_id", sub)
      .single();
    if (!callerUser) return json({ error: "User record not found. Your account may not be synced." }, 403);
    if (!callerUser.is_admin) return json({ error: "Admin access required to invite users." }, 403);

    const { email, name, role, is_admin, customer_id } = await req.json();
    if (!email || !name) return json({ error: "email and name are required" }, 400);

    // Create auth user
    const tempPassword = crypto.randomUUID() + "Aa1!";
    const { data: newAuth, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name },
    });

    let authUserId: string | null = null;

    if (createErr) {
      const isAlreadyRegistered =
        createErr.message?.includes("already been registered") ||
        createErr.message?.includes("already exists");
      if (!isAlreadyRegistered) return json({ error: createErr.message }, 400);
    } else {
      authUserId = newAuth!.user.id;

      const { error: insertErr } = await adminClient.from("portal_users").insert({
        auth_id: authUserId,
        email,
        name,
        role: role ?? "customer",
        is_admin: is_admin === true,
        customer_id: customer_id ?? null,
      });

      if (insertErr) {
        const isDuplicate =
          insertErr.message?.includes("duplicate key") ||
          insertErr.message?.includes("unique constraint");
        if (!isDuplicate) {
          return json({ error: insertErr.message || "Failed to create user record" }, 500);
        }
      }
    }

    // Generate password-recovery token
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${DEFAULT_ORIGIN}/reset-password` },
    });
    if (linkErr) return json({ error: linkErr.message || "Failed to generate invite link" }, 500);

    // Extract token_hash and build direct link on our domain (avoids supabase.co hop / spam filters)
    const rawLink = linkData?.properties?.action_link || "";
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

    // Load email template from DB, fall back to hardcoded if unavailable
    let emailSubject = "Welcome to Freemans Industrial Supplies — set your password";
    let emailHtml: string;

    const { data: tmplRow } = await adminClient
      .from("email_templates")
      .select("subject, html_body")
      .eq("id", "invite_user")
      .single();

    if (tmplRow?.html_body) {
      emailSubject = tmplRow.subject || emailSubject;
      emailHtml = applyTemplateVars(tmplRow.html_body, {
        name,
        reset_link: resetLink,
        year: String(new Date().getFullYear()),
      });
    } else {
      emailHtml = fallbackHtml(name, resetLink);
    }

    // Send via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: INVITE_FROM_EMAIL,
        to: [email],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error("Resend error:", errBody);
      return json({ success: true, user_id: authUserId, email_sent: false, email_error: errBody });
    }

    return json({ success: true, user_id: authUserId, email_sent: true });
  } catch (e: any) {
    console.error("invite-user error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
