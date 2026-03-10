/**
 * ┌─────────────────────────────────────────────────────┐
 * │  TESTS: Auth Service (Supabase interactions)        │
 * │  Ubicación: src/features/auth/authService.test.ts   │
 * └─────────────────────────────────────────────────────┘
 *
 * ¿QUÉ ESTAMOS TESTEANDO?
 *
 * El servicio que habla con Supabase: login, logout,
 * y getAuthenticatedProfile. Aquí SÍ usamos mocks porque
 * el service llama a `supabase.auth.signInWithPassword()`, etc.
 *
 * ── CONCEPTO CLAVE: MOCKING ─────────────────────────────
 *
 * Un "mock" es una versión fake de una dependencia externa.
 * En vez de llamar a Supabase real (que requiere red, DB, etc.),
 * le decimos al mock: "cuando te llamen, retorna ESTO".
 *
 * Ejemplo:
 *   signInWithPassword.mockResolvedValueOnce({ data: {...}, error: null })
 *
 * Esto hace que la PRÓXIMA llamada a signInWithPassword retorne
 * ese objeto, como si Supabase hubiera respondido así.
 *
 * - mockResolvedValueOnce()  → retorna UNA VEZ (la próxima llamada)
 * - mockResolvedValue()      → retorna SIEMPRE (todas las llamadas)
 * - mockRejectedValueOnce()  → simula que la Promise falla (throw)
 *
 * ── ¿POR QUÉ `vi.mocked()`? ───────────────────────────
 *
 * TypeScript no sabe que `supabase.auth.signInWithPassword`
 * es un `vi.fn()` (lo reemplazamos en test-setup.ts).
 * `vi.mocked()` le dice a TS: "confía, esto es un mock".
 * Así podemos usar `.mockResolvedValueOnce()` sin errores de tipo.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import type { User } from "@/types";

// ── Castear los mocks para que TypeScript acepte .mockX() ────
//
// Esto es necesario porque en test-setup.ts definimos los mocks,
// pero TypeScript todavía piensa que son funciones reales de Supabase.
//
const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
const mockSignOut = vi.mocked(supabase.auth.signOut);
const mockGetUser = vi.mocked(supabase.auth.getUser);
const mockGetSession = vi.mocked(supabase.auth.getSession);
const mockFrom = vi.mocked(supabase.from);

// ── Helpers ──────────────────────────────────────────────────
//
// Funciones reutilizables para configurar los mocks rápidamente.
// Esto evita repetir la misma estructura de mock en cada test.
//

const fakeUser: User = {
  id: "user-123",
  email: "test@test.com",
  fullname: "Test User",
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
} as User;

/**
 * Configura el mock de `supabase.from("users").select("*").eq("id", ...).single()`
 * para que retorne un profile específico (o null).
 */
function mockProfileQuery(profile: User | null) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: profile ? null : { message: "Not found" },
  });

  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

  mockFrom.mockReturnValue({ select: mockSelect } as any);
}

describe("Auth Service", () => {
  // Resetear todos los mocks antes de cada test.
  // Esto limpia los `.mockResolvedValueOnce()` anteriores
  // y resetea los contadores de `.toHaveBeenCalledTimes()`.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 1: login()
  // ═══════════════════════════════════════════════════════════

  describe("login()", () => {
    it("retorna el usuario cuando las credenciales son válidas", async () => {
      // ARRANGE: configuramos el mock de Supabase para responder "éxito"
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: "user-123" } as any,
          session: {} as any,
        },
        error: null,
      });

      // También el query del profile
      mockProfileQuery(fakeUser);

      // ACT
      const result = await authService.login("test@test.com", "password123");

      // ASSERT
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.id).toBe("user-123");
        expect(result.user.email).toBe("test@test.com");
      }

      // Verificamos que Supabase fue llamado con los params correctos
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
    });

    it("retorna error cuando las credenciales son inválidas", async () => {
      // ARRANGE: Supabase responde con error
      mockSignIn.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" } as any,
      });

      // ACT
      const result = await authService.login("bad@test.com", "wrongpass");

      // ASSERT
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid login credentials");
      }
    });

    it("hace signOut y retorna error si el perfil de usuario no existe", async () => {
      // ARRANGE: Supabase auth OK, pero NO hay perfil en la tabla `users`
      mockSignIn.mockResolvedValueOnce({
        data: {
          user: { id: "user-999" } as any,
          session: {} as any,
        },
        error: null,
      });

      // El profile query retorna null
      mockProfileQuery(null);
      mockSignOut.mockResolvedValueOnce({ error: null });

      // ACT
      const result = await authService.login("ghost@test.com", "pass");

      // ASSERT
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No se encontró el perfil de usuario");
      }

      // Verificamos que hizo signOut (para limpiar la sesión huérfana)
      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 2: logout()
  // ═══════════════════════════════════════════════════════════

  describe("logout()", () => {
    it("llama a signOut con scope local", async () => {
      mockSignOut.mockResolvedValueOnce({ error: null });

      await authService.logout();

      expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("NUNCA lanza error, incluso si signOut falla", async () => {
      // ARRANGE: signOut explota con error de red
      mockSignOut.mockRejectedValueOnce(new Error("Network error"));

      // ACT + ASSERT: no debe lanzar
      // ⚡ La función `.resolves` verifica que una Promise se resuelve sin error.
      await expect(authService.logout()).resolves.toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 3: getAuthenticatedProfile()
  // ═══════════════════════════════════════════════════════════

  describe("getAuthenticatedProfile()", () => {
    it("retorna el profile cuando hay sesión válida", async () => {
      // ARRANGE
      mockGetSession.mockResolvedValueOnce({
        data: { session: {} as any },
        error: null,
      });
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: "user-123" } as any },
        error: null,
      });
      mockProfileQuery(fakeUser);

      // ACT
      const profile = await authService.getAuthenticatedProfile();

      // ASSERT
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
      // getUser should not be called if there's no local session
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it("retorna null cuando hay sesión pero no está autenticado en SSR", async () => {
      // Pasa el primer check de sesión
      mockGetSession.mockResolvedValueOnce({
        data: { session: {} as any },
        error: null,
      });
      // Falla el segundo de validación real
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Not authenticated" } as any,
      });

      const profile = await authService.getAuthenticatedProfile();

      expect(profile).toBeNull();
    });

    it("retorna null cuando el JWT expiró durante la validación", async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: {} as any },
        error: null,
      });

      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: "JWT expired" } as any,
      });

      const profile = await authService.getAuthenticatedProfile();

      expect(profile).toBeNull();
    });
  });
});
