import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { usersService } from "./usersService";
import type { User } from "@/types";

const mockFrom = vi.mocked(supabase.from);
const mockRpc = vi.mocked(supabase.rpc);
const mockInvoke = vi.mocked(supabase.functions.invoke);

const fullBusinessId = "10000000-0000-0000-0000-000000000001";
const estilosBusinessId = "10000000-0000-0000-0000-000000000002";

function userRow(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "ana@tienda.com",
    fullname: "Ana Morales",
    role: "employee",
    is_active: true,
    default_business_id: fullBusinessId,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    ...overrides,
  };
}

function orderedQuery(data: unknown, error: { message: string } | null = null) {
  return {
    select: vi.fn(() => ({
      order: vi.fn().mockResolvedValue({ data, error }),
    })),
  };
}

describe("usersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combina usuarios con múltiples negocios asignados", async () => {
    mockFrom.mockImplementation((table) => {
      if (table === "users") {
        return orderedQuery([userRow({ is_active: undefined as never })]) as never;
      }

      return orderedQuery([
        { user_id: "user-1", business_id: fullBusinessId },
        { user_id: "user-1", business_id: estilosBusinessId },
      ]) as never;
    });

    await expect(usersService.getManagedUsers()).resolves.toEqual([
      expect.objectContaining({
        id: "user-1",
        is_active: true,
        business_ids: [fullBusinessId, estilosBusinessId],
      }),
    ]);
  });

  it("crea usuarios mediante una Edge Function administrativa", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: userRow({ id: "created-user" }),
      error: null,
    } as never);

    await usersService.createUser({
      email: "nuevo@tienda.com",
      password: "password123",
      fullname: "Nuevo Usuario",
      role: "employee",
      business_ids: [fullBusinessId],
      default_business_id: fullBusinessId,
    });

    expect(mockInvoke).toHaveBeenCalledWith("admin-create-user", {
      body: {
        email: "nuevo@tienda.com",
        password: "password123",
        fullname: "Nuevo Usuario",
        role: "employee",
        business_ids: [fullBusinessId],
        default_business_id: fullBusinessId,
      },
    });
  });

  it("muestra el mensaje JSON devuelto por la Edge Function cuando la creación falla", async () => {
    const error = new Error("Edge Function returned a non-2xx status code") as Error & {
      context: Response;
    };
    error.context = new Response(JSON.stringify({ message: "An unexpected error occurred" }), { status: 500 });

    mockInvoke.mockResolvedValueOnce({
      data: null,
      error,
    } as never);

    await expect(
      usersService.createUser({
        email: "nuevo@tienda.com",
        password: "password123",
        fullname: "Nuevo Usuario",
        role: "employee",
        business_ids: [fullBusinessId],
        default_business_id: fullBusinessId,
      }),
    ).rejects.toThrow("An unexpected error occurred");
  });

  it("actualiza rol, estado y accesos mediante la RPC administrativa", async () => {
    mockRpc.mockResolvedValueOnce({
      data: userRow({ id: "user-1", role: "admin", is_active: false }),
      error: null,
    } as never);

    const result = await usersService.updateUser({
      id: "user-1",
      fullname: "Ana Admin",
      role: "admin",
      is_active: false,
      business_ids: [],
      default_business_id: fullBusinessId,
    });

    expect(result.business_ids).toEqual([]);
    expect(mockRpc).toHaveBeenCalledWith("admin_update_user", {
      p_user_id: "user-1",
      p_fullname: "Ana Admin",
      p_role: "admin",
      p_is_active: false,
      p_business_ids: [],
      p_default_business_id: fullBusinessId,
    });
  });
});
