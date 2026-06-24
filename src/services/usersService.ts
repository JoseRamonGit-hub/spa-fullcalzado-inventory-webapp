import { supabase } from "@/lib/supabase";
import type { CreateUserInput, ManagedUser, UpdateUserInput } from "@/types";

async function getFunctionErrorMessage(error: unknown) {
  const context = error instanceof Error && "context" in error ? error.context : null;

  if (context instanceof Response) {
    const body = await context
      .clone()
      .json()
      .catch(() => null);

    if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
      return body.error;
    }

    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      return body.message;
    }
  }

  return error instanceof Error ? error.message : "No se pudo completar la operación.";
}

function mergeUsersWithAccess(
  users: Omit<ManagedUser, "business_ids">[],
  accessRows: { user_id: string; business_id: string }[],
): ManagedUser[] {
  const businessIdsByUser = new Map<string, string[]>();

  for (const access of accessRows) {
    const current = businessIdsByUser.get(access.user_id) ?? [];
    current.push(access.business_id);
    businessIdsByUser.set(access.user_id, current);
  }

  return users.map((user) => ({
    ...user,
    is_active: user.is_active ?? true,
    business_ids: businessIdsByUser.get(user.id) ?? [],
  }));
}

export const usersService = {
  getManagedUsers: async (): Promise<ManagedUser[]> => {
    const [usersResult, accessResult] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("user_business_access").select("user_id, business_id").order("created_at", { ascending: true }),
    ]);

    if (usersResult.error) throw new Error(usersResult.error.message);
    if (accessResult.error) throw new Error(accessResult.error.message);

    return mergeUsersWithAccess(usersResult.data, accessResult.data);
  },

  createUser: async (input: CreateUserInput): Promise<ManagedUser> => {
    const { data, error } = await supabase.functions.invoke<ManagedUser>("admin-create-user", {
      body: input,
    });

    if (error) throw new Error(await getFunctionErrorMessage(error));
    if (!data) throw new Error("No se pudo crear el usuario.");

    return {
      ...data,
      is_active: data.is_active ?? true,
      business_ids: input.business_ids,
    };
  },

  updateUser: async (input: UpdateUserInput): Promise<ManagedUser> => {
    const { data, error } = await supabase.rpc("admin_update_user", {
      p_user_id: input.id,
      p_fullname: input.fullname,
      p_role: input.role,
      p_is_active: input.is_active,
      p_business_ids: input.business_ids,
      p_default_business_id: input.default_business_id,
    });

    if (error) throw new Error(error.message);

    return {
      ...data,
      is_active: data.is_active ?? true,
      business_ids: input.business_ids,
    };
  },
};
