import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
const mockSignOut = vi.mocked(supabase.auth.signOut);
const mockGetUser = vi.mocked(supabase.auth.getUser);
const mockGetSession = vi.mocked(supabase.auth.getSession);
const mockFrom = vi.mocked(supabase.from);

const fakeUser: User = {
  id: "user-123",
  email: "test@test.com",
  fullname: "Test User",
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
} as User;

function mockProfileQuery(profile: User | null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: profile ? null : { message: "Not found" },
  });

  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

  mockFrom.mockReturnValue({ select: mockSelect } as never);
}

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login()", () => {
    it("retorna el usuario cuando las credenciales son válidas", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: "user-123" } as never,
          session: {} as never,
        },
        error: null,
      });

      mockProfileQuery(fakeUser);

      const result = await authService.login("test@test.com", "password123");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.id).toBe("user-123");
        expect(result.user.email).toBe("test@test.com");
      }

      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });

    it("retorna error cuando las credenciales son inválidas", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as never,
      });

      const result = await authService.login("bad@test.com", "wrongpass");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.");
      }
    });

    it("traduce errores por código y de red", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { code: "over_request_rate_limit", message: "Request rate limit reached" } as never,
      });
      const rateLimited = await authService.login("a@test.com", "x");
      expect(!rateLimited.success && rateLimited.error).toBe(
        "Demasiados intentos seguidos. Espera un minuto antes de volver a intentarlo.",
      );

      mockSignIn.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      const offline = await authService.login("a@test.com", "x");
      expect(!offline.success && offline.error).toBe(
        "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.",
      );
    });

    it("hace signOut y retorna error si el perfil de usuario no existe", async () => {
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: "user-999" } as never,
          session: {} as never,
        },
        error: null,
      });

      mockProfileQuery(null);
      mockSignOut.mockResolvedValueOnce({ error: null });

      const result = await authService.login("ghost@test.com", "pass");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Tu usuario no tiene un perfil activo. Habla con el administrador.");
      }

      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
    });
  });

  describe("logout()", () => {
    it("llama a signOut con scope local", async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      await authService.logout();

      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("NUNCA lanza error, incluso si signOut falla", async () => {
      mockSignOut.mockRejectedValueOnce(new Error("Network error"));

      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  describe("getAuthenticatedProfile()", () => {
    it("retorna el profile cuando hay sesión válida", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: {} as never },
        error: null,
      });
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } as never },
        error: null,
      });
      mockProfileQuery(fakeUser);

      const profile = await authService.getAuthenticatedProfile();

      expect(profile).toEqual(fakeUser);
      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });

    it("retorna null cuando no hay sesión local", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const profile = await authService.getAuthenticatedProfile();

      expect(profile).toBeNull();
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("retorna null cuando la sesión local ya no es válida", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: {} as never },
        error: null,
      });
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Not authenticated" } as never,
      });

      const profile = await authService.getAuthenticatedProfile();

      expect(profile).toBeNull();
    });

    it("retorna null cuando el JWT expiró durante la validación", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: {} as never },
        error: null,
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "JWT expired" } as never,
      });

      const profile = await authService.getAuthenticatedProfile();

      expect(profile).toBeNull();
    });
  });
});
