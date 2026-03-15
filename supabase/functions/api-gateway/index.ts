import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

async function hashKey(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `chk_${hex}`;
}

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// Authenticate via X-API-Key header, returns tenant_id and scopes
async function authenticateApiKey(
  req: Request
): Promise<{ tenant_id: string; scopes: string[] } | Response> {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return err("Missing X-API-Key header", 401);

  const keyHash = await hashKey(apiKey);
  const sb = serviceClient();

  const { data, error } = await sb
    .from("api_keys")
    .select("tenant_id, scopes, expires_at, revoked_at")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return err("Invalid API key", 401);
  if (data.expires_at && new Date(data.expires_at) < new Date())
    return err("API key expired", 401);

  // Fire-and-forget update last_used_at
  sb.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("key_hash", keyHash).then();

  return { tenant_id: data.tenant_id, scopes: data.scopes };
}

// Authenticate via Authorization Bearer (for key management from the UI)
async function authenticateBearer(
  req: Request
): Promise<{ tenant_id: string; user_id: string } | Response> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return err("Missing Authorization header", 401);

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });

  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return err("Invalid token", 401);

  // Get tenant_id from users table
  const svc = serviceClient();
  const { data: userData, error: userErr } = await svc
    .from("users")
    .select("tenant_id, id")
    .eq("auth_id", data.user.id)
    .single();

  if (userErr || !userData) return err("User not found", 403);
  return { tenant_id: userData.tenant_id, user_id: userData.id };
}

function parseRoute(url: URL): { segments: string[]; params: URLSearchParams } {
  const pathname = url.pathname.replace(/^\/api-gateway/, "");
  const segments = pathname.split("/").filter(Boolean);
  return { segments, params: url.searchParams };
}

function extractInstanceType(settings: unknown): string {
  if (settings && typeof settings === "object" && "instanceType" in (settings as Record<string, unknown>)) {
    return ((settings as Record<string, unknown>).instanceType as string) || "standard";
  }
  return "standard";
}

function enrichInstance(row: Record<string, unknown>) {
  const settings = (row.settings || {}) as Record<string, unknown>;
  return {
    ...row,
    type: extractInstanceType(settings),
    dofe_level: settings.dofeLevel || null,
    expedition_type: settings.expeditionType || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const { segments, params } = parseRoute(url);

  // Health check
  if (segments[0] === "health") {
    return json({ success: true, status: "healthy", timestamp: new Date().toISOString() });
  }

  // --- Key management routes (Bearer auth) ---
  if (segments[0] === "api" && segments[1] === "v1" && segments[2] === "api-keys") {
    const action = segments[3];
    const authResult = await authenticateBearer(req);
    if (authResult instanceof Response) return authResult;
    const { tenant_id, user_id } = authResult;
    const sb = serviceClient();

    if (req.method === "POST" && action === "generate") {
      const body = await req.json();
      const rawKey = generateKey();
      const keyHash = await hashKey(rawKey);
      const prefix = rawKey.slice(0, 12);

      const { error: insertErr } = await sb.from("api_keys").insert({
        tenant_id,
        user_id,
        key_hash: keyHash,
        key_prefix: prefix,
        name: body.name || "Untitled",
        scopes: body.scopes || ["read"],
        expires_at: body.expires_at || null,
        created_by: user_id,
      });

      if (insertErr) return err(insertErr.message, 500);
      return json({ success: true, data: { key: rawKey, prefix } });
    }

    if (req.method === "GET" && action === "list") {
      const { data, error: listErr } = await sb
        .from("api_keys")
        .select("id, key_prefix, name, scopes, created_at, last_used_at, expires_at, revoked_at")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false });

      if (listErr) return err(listErr.message, 500);
      return json({ success: true, data });
    }

    if (req.method === "DELETE" && action === "revoke") {
      const body = await req.json();
      if (!body.id) return err("Missing key id");

      const { error: revokeErr } = await sb
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", body.id)
        .eq("tenant_id", tenant_id);

      if (revokeErr) return err(revokeErr.message, 500);
      return json({ success: true });
    }

    return err("Not found", 404);
  }

  // --- Data routes (API key auth) ---
  if (segments[0] !== "api" || segments[1] !== "v1") return err("Not found", 404);

  const authResult = await authenticateApiKey(req);
  if (authResult instanceof Response) return authResult;
  const { tenant_id, scopes } = authResult;

  const resource = segments[2];
  const resourceId = segments[3];
  const subResource = segments[3]; // for groups/supergroups, groups/subgroups
  const sb = serviceClient();

  // Scope checks
  const isWrite = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
  if (isWrite && !scopes.includes("write") && !scopes.includes("admin"))
    return err("Insufficient scope — write required", 403);

  // Helper for paginated response
  const limit = parseInt(params.get("limit") || "50");
  const offset = parseInt(params.get("offset") || "0");

  // ---- INSTANCES ----
  if (resource === "instances") {
    if (req.method === "GET" && !resourceId) {
      let query = sb.from("instances").select("*", { count: "exact" }).eq("tenant_id", tenant_id).is("deleted_at", null).range(offset, offset + limit - 1);
      const typeFilter = params.get("type");
      // We'll filter type in JS since it's in settings JSONB
      const { data, error: qErr, count } = await query;
      if (qErr) return err(qErr.message, 500);

      let results = (data || []).map(enrichInstance);
      if (typeFilter) results = results.filter((r) => r.type === typeFilter);

      return json({ success: true, data: results, meta: { total: typeFilter ? results.length : count, limit, offset } });
    }
    if (req.method === "GET" && resourceId) {
      const { data, error: qErr } = await sb.from("instances").select("*").eq("id", resourceId).eq("tenant_id", tenant_id).maybeSingle();
      if (qErr) return err(qErr.message, 500);
      if (!data) return err("Not found", 404);
      return json({ success: true, data: enrichInstance(data) });
    }
    if (req.method === "POST") {
      const body = await req.json();
      const settings: Record<string, unknown> = body.settings || {};
      if (body.type) settings.instanceType = body.type;
      if (body.dofe_level) settings.dofeLevel = body.dofe_level;
      if (body.expedition_type) settings.expeditionType = body.expedition_type;

      const { data, error: iErr } = await sb.from("instances").insert({
        ...body,
        tenant_id,
        settings,
        id: body.id || crypto.randomUUID(),
      }).select().single();
      if (iErr) return err(iErr.message, 500);
      return json({ success: true, data: enrichInstance(data) }, 201);
    }
    if (req.method === "PATCH" && resourceId) {
      const body = await req.json();
      if (body.type || body.dofe_level || body.expedition_type) {
        const { data: existing } = await sb.from("instances").select("settings").eq("id", resourceId).eq("tenant_id", tenant_id).single();
        const settings: Record<string, unknown> = (existing?.settings as Record<string, unknown>) || {};
        if (body.type) settings.instanceType = body.type;
        if (body.dofe_level) settings.dofeLevel = body.dofe_level;
        if (body.expedition_type) settings.expeditionType = body.expedition_type;
        body.settings = settings;
        delete body.type;
        delete body.dofe_level;
        delete body.expedition_type;
      }
      const { data, error: uErr } = await sb.from("instances").update(body).eq("id", resourceId).eq("tenant_id", tenant_id).select().single();
      if (uErr) return err(uErr.message, 500);
      return json({ success: true, data: enrichInstance(data) });
    }
    if (req.method === "DELETE" && resourceId) {
      const { error: dErr } = await sb.from("instances").update({ deleted_at: new Date().toISOString() }).eq("id", resourceId).eq("tenant_id", tenant_id);
      if (dErr) return err(dErr.message, 500);
      return json({ success: true });
    }
  }

  // ---- PARTICIPANTS ----
  if (resource === "participants") {
    if (req.method === "GET" && !resourceId) {
      let query = sb.from("participants").select("*", { count: "exact" }).eq("tenant_id", tenant_id).range(offset, offset + limit - 1);
      const instanceId = params.get("instance_id");
      if (instanceId) query = query.eq("instance_id", instanceId);
      const { data, error: qErr, count } = await query;
      if (qErr) return err(qErr.message, 500);
      return json({ success: true, data, meta: { total: count, limit, offset } });
    }
    if (req.method === "GET" && resourceId) {
      const { data, error: qErr } = await sb.from("participants").select("*").eq("id", resourceId).eq("tenant_id", tenant_id).maybeSingle();
      if (qErr) return err(qErr.message, 500);
      if (!data) return err("Not found", 404);
      return json({ success: true, data });
    }
    if (req.method === "POST") {
      const body = await req.json();
      const { data, error: iErr } = await sb.from("participants").insert({ ...body, tenant_id, id: body.id || crypto.randomUUID(), full_name: `${body.first_name} ${body.surname}` }).select().single();
      if (iErr) return err(iErr.message, 500);
      return json({ success: true, data }, 201);
    }
    if (req.method === "PATCH" && resourceId) {
      const body = await req.json();
      const { data, error: uErr } = await sb.from("participants").update(body).eq("id", resourceId).eq("tenant_id", tenant_id).select().single();
      if (uErr) return err(uErr.message, 500);
      return json({ success: true, data });
    }
    if (req.method === "DELETE" && resourceId) {
      const { error: dErr } = await sb.from("participants").delete().eq("id", resourceId).eq("tenant_id", tenant_id);
      if (dErr) return err(dErr.message, 500);
      return json({ success: true });
    }
  }

  // ---- GROUPS ----
  if (resource === "groups") {
    if (subResource === "supergroups") {
      const table = "supergroups";
      if (req.method === "GET") {
        const instanceId = params.get("instance_id");
        let query = sb.from(table).select("*", { count: "exact" }).eq("tenant_id", tenant_id).range(offset, offset + limit - 1);
        if (instanceId) query = query.eq("instance_id", instanceId);
        const { data, error: qErr, count } = await query;
        if (qErr) return err(qErr.message, 500);
        return json({ success: true, data, meta: { total: count, limit, offset } });
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error: iErr } = await sb.from(table).insert({ ...body, tenant_id, id: body.id || crypto.randomUUID() }).select().single();
        if (iErr) return err(iErr.message, 500);
        return json({ success: true, data }, 201);
      }
    }
    if (subResource === "subgroups") {
      const table = "subgroups";
      if (req.method === "GET") {
        const instanceId = params.get("instance_id");
        let query = sb.from(table).select("*", { count: "exact" }).eq("tenant_id", tenant_id).range(offset, offset + limit - 1);
        if (instanceId) query = query.eq("instance_id", instanceId);
        const { data, error: qErr, count } = await query;
        if (qErr) return err(qErr.message, 500);
        return json({ success: true, data, meta: { total: count, limit, offset } });
      }
      if (req.method === "POST") {
        const body = await req.json();
        const { data, error: iErr } = await sb.from(table).insert({ ...body, tenant_id, id: body.id || crypto.randomUUID() }).select().single();
        if (iErr) return err(iErr.message, 500);
        return json({ success: true, data }, 201);
      }
    }
  }

  // ---- BLOCKS ----
  if (resource === "blocks") {
    if (req.method === "GET") {
      const { data, error: qErr, count } = await sb.from("blocks").select("*", { count: "exact" }).eq("tenant_id", tenant_id).is("deleted_at", null).range(offset, offset + limit - 1);
      if (qErr) return err(qErr.message, 500);
      return json({ success: true, data, meta: { total: count, limit, offset } });
    }
    if (req.method === "POST") {
      const body = await req.json();
      const { data, error: iErr } = await sb.from("blocks").insert({ ...body, tenant_id, id: body.id || crypto.randomUUID() }).select().single();
      if (iErr) return err(iErr.message, 500);
      return json({ success: true, data }, 201);
    }
  }

  // ---- ROOMS ----
  if (resource === "rooms") {
    if (req.method === "GET") {
      const { data, error: qErr, count } = await sb.from("rooms").select("*", { count: "exact" }).eq("tenant_id", tenant_id).is("deleted_at", null).range(offset, offset + limit - 1);
      if (qErr) return err(qErr.message, 500);
      return json({ success: true, data, meta: { total: count, limit, offset } });
    }
    if (req.method === "POST") {
      const body = await req.json();
      const { data, error: iErr } = await sb.from("rooms").insert({ ...body, tenant_id, id: body.id || crypto.randomUUID() }).select().single();
      if (iErr) return err(iErr.message, 500);
      return json({ success: true, data }, 201);
    }
  }

  return err("Not found", 404);
});
