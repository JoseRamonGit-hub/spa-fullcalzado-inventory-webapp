import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CreateUserPayload = {
  email: string;
  password: string;
  fullname: string;
  role: "employee" | "admin";
  business_ids: string[];
  default_business_id: string;
};

type ParsePayloadResult =
  | {
      success: true;
      data: CreateUserPayload;
    }
  | {
      success: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGuid(value: unknown): value is string {
  return typeof value === "string" && guidRegex.test(value);
}

function parseCreateUserPayload(value: unknown): ParsePayloadResult {
  if (!isRecord(value)) {
    return { success: false, error: "Datos inválidos." };
  }

  const fullname = typeof value.fullname === "string" ? value.fullname.trim() : "";
  const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : "";
  const password = typeof value.password === "string" ? value.password.trim() : "";
  const role = value.role;
  const businessIds = Array.isArray(value.business_ids) ? value.business_ids : [];
  const defaultBusinessId = value.default_business_id;

  if (fullname.length < 2) {
    return { success: false, error: "El nombre debe tener al menos 2 caracteres." };
  }

  if (!emailRegex.test(email)) {
    return { success: false, error: "Correo electrónico inválido." };
  }

  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }

  if (role !== "employee" && role !== "admin") {
    return { success: false, error: "Selecciona un rol válido." };
  }

  if (!businessIds.every(isGuid)) {
    return { success: false, error: "Selecciona negocios válidos." };
  }

  if (!isGuid(defaultBusinessId)) {
    return { success: false, error: "Selecciona un negocio válido." };
  }

  if (role !== "admin" && businessIds.length === 0) {
    return { success: false, error: "Un empleado debe tener al menos un negocio asignado." };
  }

  if (businessIds.length > 0 && !businessIds.includes(defaultBusinessId)) {
    return { success: false, error: "El negocio predeterminado debe estar dentro de los negocios asignados." };
  }

  return {
    success: true,
    data: {
      fullname,
      email,
      password,
      role,
      business_ids: [...new Set(businessIds)],
      default_business_id: defaultBusinessId,
    },
  };
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

async function rollbackCreatedUser(adminClient: ReturnType<typeof createClient>, userId: string) {
  await adminClient.from("user_business_access").delete().eq("user_id", userId);
  await adminClient.from("users").delete().eq("id", userId);
  await adminClient.auth.admin.deleteUser(userId);
}

async function handleRequest(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Método no permitido." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse(500, { error: "La función no tiene configuradas las credenciales de Supabase." });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return jsonResponse(401, { error: "Sesión requerida." });
  }

  const rawBody = await req.json().catch(() => null);
  const parsed = parseCreateUserPayload(rawBody);

  if (!parsed.success) {
    return jsonResponse(400, { error: parsed.error });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { Authorization: authorization },
    },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user: actorUser },
    error: actorAuthError,
  } = await userClient.auth.getUser();

  if (actorAuthError || !actorUser) {
    return jsonResponse(401, { error: "Sesión inválida." });
  }

  const { data: actorProfile, error: actorProfileError } = await userClient
    .from("users")
    .select("role,is_active")
    .eq("id", actorUser.id)
    .single();

  if (actorProfileError || actorProfile?.role !== "admin" || actorProfile.is_active !== true) {
    return jsonResponse(403, { error: "Solo un administrador activo puede crear usuarios." });
  }

  const { data: createdAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      fullname: parsed.data.fullname,
    },
  });

  if (createAuthError || !createdAuthUser.user?.id) {
    return jsonResponse(createAuthError?.status ?? 400, {
      error: createAuthError?.message ?? "No se pudo crear el usuario.",
    });
  }

  const createdUserId = createdAuthUser.user.id;
  const { data: managedUser, error: profileError } = await userClient.rpc("admin_update_user", {
    p_user_id: createdUserId,
    p_fullname: parsed.data.fullname,
    p_role: parsed.data.role,
    p_is_active: true,
    p_business_ids: parsed.data.business_ids,
    p_default_business_id: parsed.data.default_business_id,
  });

  if (profileError || !managedUser) {
    await rollbackCreatedUser(adminClient, createdUserId).catch(() => undefined);

    return jsonResponse(400, {
      error: profileError?.message ?? "No se pudo configurar el perfil del usuario.",
    });
  }

  return jsonResponse(200, {
    ...managedUser,
    business_ids: parsed.data.business_ids,
  });
}

Deno.serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("admin-create-user unexpected error", error);

    return jsonResponse(500, {
      error: "No se pudo crear el usuario. Revisa los logs de la Edge Function.",
    });
  }
});
