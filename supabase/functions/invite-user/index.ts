import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (authErr || !caller) return json({ error: "Unauthorized" }, 401);

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
    if (createErr) return json({ error: createErr.message }, 400);

    // Create user record in users table
    const newUserId = crypto.randomUUID();
    await adminClient.from("users").insert({
      id: newUserId,
      auth_id: newAuth.user.id,
      email,
      first_name,
      last_name: last_name || null,
      surname: last_name || null,
      full_name: `${first_name} ${last_name || ""}`.trim(),
      tenant_id: callerUser.tenant_id,
      status: "active",
    });

    // Assign role if provided
    if (role_id) {
      await adminClient.from("user_role_assignments").insert({
        user_id: newUserId,
        role_id,
      });
    }

    // Generate password reset link for the invite
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${req.headers.get("origin") || "https://checkpoint.jlgb.org"}/reset-password` },
    });

    const resetLink = linkData?.properties?.action_link || "";

    // Send invite email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Checkpoint <noreply@checkpoint.jlgb.org>",
        to: [email],
        subject: "You've been invited to Checkpoint",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 22px; color: #1a1a1a; margin-bottom: 8px;">Welcome to Checkpoint</h1>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Hi ${first_name},<br/><br/>
              You've been invited to join Checkpoint. Click the button below to set your password and get started.
            </p>
            <a href="${resetLink}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background-color: #0070f3; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px;">
              Set your password
            </a>
            <p style="color: #888; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
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
