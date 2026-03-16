import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROJECT_REF = "avcqdbhnxzfkxxsqdvae";
const MANAGEMENT_API = "https://api.supabase.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Verify caller is an authenticated Supabase user
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error: authErr } = await sb.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authErr || !user) {
    return json({ success: false, error: "Unauthorized" }, 401);
  }

  // Management API key (set as an Edge Function secret:
  //   supabase secrets set SUPABASE_MANAGEMENT_API_KEY=sbp_xxxx)
  const mgmtKey = Deno.env.get("SUPABASE_MANAGEMENT_API_KEY");
  if (!mgmtKey) {
    return json({
      success: false,
      error: "SUPABASE_MANAGEMENT_API_KEY secret not configured. " +
        "Run: supabase secrets set SUPABASE_MANAGEMENT_API_KEY=sbp_<your-token>",
      setup_required: true,
    }, 503);
  }

  const mgmtHeaders = {
    Authorization: `Bearer ${mgmtKey}`,
    "Content-Type": "application/json",
  };

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  // GET /backup-manager/list — list all backups
  if (req.method === "GET" && action === "list") {
    const res = await fetch(
      `${MANAGEMENT_API}/v1/projects/${PROJECT_REF}/database/backups`,
      { headers: mgmtHeaders }
    );
    const data = await res.json();
    if (!res.ok) {
      return json({ success: false, error: data?.message ?? "Failed to fetch backups" }, res.status);
    }
    return json({ success: true, data });
  }

  // POST /backup-manager/restore — restore a backup by ID
  if (req.method === "POST" && action === "restore") {
    const body = await req.json();
    const { backup_id } = body as { backup_id: string | number };
    if (!backup_id) {
      return json({ success: false, error: "backup_id is required" }, 400);
    }
    const res = await fetch(
      `${MANAGEMENT_API}/v1/projects/${PROJECT_REF}/database/backups/restore`,
      {
        method: "POST",
        headers: mgmtHeaders,
        body: JSON.stringify({ backup_id }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return json({ success: false, error: data?.message ?? "Restore failed" }, res.status);
    }
    return json({ success: true, data });
  }

  return json({ success: false, error: "Not found" }, 404);
});
