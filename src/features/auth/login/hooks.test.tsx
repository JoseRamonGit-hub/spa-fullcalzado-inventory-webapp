/**
 * ┌─────────────────────────────────────────────────────┐
 * │  TESTS: Auth Hooks (useLogin, useLogout)            │
 * │  Ubicación: src/features/auth/hooks.test.ts         │
 * └─────────────────────────────────────────────────────┘
 *
 * ¿QUÉ ESTAMOS TESTEANDO?
 *
 * Los hooks de React que conectan el servicio de auth con
 * el store de Zustand, React Query, y el router.
 *
 * ── CONCEPTO CLAVE: RENDERIZAR HOOKS ─────────────────
 *
 * Los hooks de React solo funcionan dentro de un componente.
 * No puedes hacer `const result = useLogin()` en un test plano.
 *
 * `renderHook()` de @testing-library/react crea un componente
 * invisible que ejecuta tu hook, permitiéndote interactuar
 * con él desde el test.
 *
 * ── CONCEPTO CLAVE: WRAPPER ──────────────────────────
 *
 * Nuestros hooks usan `useMutation` de TanStack Query,
 * que requiere un `QueryClientProvider` en el árbol de React.
 * El `wrapper` envuelve el componente invisible de renderHook
 * con los providers necesarios.
 *
 * ── CONCEPTO CLAVE: waitFor ──────────────────────────
 *
 * Las mutaciones son asíncronas. Cuando llamas `result.current.mutate()`,
 * la Promise se ejecuta en background. `waitFor()` espera hasta que
 * una condición se cumpla (o timeout).
 *
 * ── CONCEPTO CLAVE: act() ────────────────────────────
 *
 * React necesita que las actualizaciones de estado ocurran
 * dentro de `act()`. renderHook y waitFor manejan esto por ti
 * en la mayoría de los casos, pero a veces necesitas ser explícito.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { useLogin, useLogout } from "./hooks";
import { authService } from "@/services/authService";
import { useAuthStore } from "../store";
import { toast } from "sonner";
import type { User } from "@/types";
import type { ReactNode } from "react";

// ── Mock del authService ─────────────────────────────────────
//
// Aquí hacemos mock del SERVICIO, no de Supabase directamente.
// ¿Por qué? Porque los hooks no llaman a Supabase — llaman al
// servicio. Testeamos cada capa por separado (esto se llama
// "unit testing" vs "integration testing").
//
// `vi.mock("@/services/authService")` reemplaza TODAS las
// exportaciones del módulo con vi.fn() automáticamente.
//
vi.mock("@/services/authService", () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockLogin = vi.mocked(authService.login);
const mockLogout = vi.mocked(authService.logout);
const mockToastError = vi.mocked(toast.error);

// El mockNavigate viene del test-setup.ts donde mockeamos @tanstack/react-router
// Pero como es un module-level mock, necesitamos accederlo así:
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

const fakeUser: User = {
  id: "user-123",
  email: "test@test.com",
  fullname: "Test User",
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
} as User;

// ── Wrapper para los hooks ───────────────────────────────────
//
// `useMutation` necesita un QueryClientProvider.
// Creamos un QueryClient fresco para cada test (aislamiento).
//
function createWrapper() {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>;
  };
}

describe("Auth Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar el store antes de cada test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 1: useLogin
  // ═══════════════════════════════════════════════════════════

  describe("useLogin", () => {
    it("en login exitoso: setea el store y navega a /inventory", async () => {
      // ARRANGE: el service retorna éxito
      mockLogin.mockResolvedValueOnce({
        success: true,
        user: fakeUser,
      });

      // ACT: renderizamos el hook y ejecutamos la mutación
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      // Ejecutamos la mutación
      act(() => {
        result.current.mutate({ email: "test@test.com", password: "pass123" });
      });

      // ASSERT: esperamos a que la mutación termine
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verificamos que el store se actualizó
      const state = useAuthStore.getState();
      expect(state.user).toEqual(fakeUser);
      expect(state.isAuthenticated).toBe(true);

      // Verificamos que navegó a /inventory
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/inventory" });
    });

    it("en login fallido: muestra toast de error y NO navega", async () => {
      // ARRANGE
      mockLogin.mockResolvedValueOnce({
        success: false,
        error: "Credenciales incorrectas",
      });

      // ACT
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate({ email: "bad@test.com", password: "wrong" });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // ASSERT: el store NO se modificó
      expect(useAuthStore.getState().isAuthenticated).toBe(false);

      // Verificamos que se mostró el toast de error
      expect(mockToastError).toHaveBeenCalledWith("Credenciales incorrectas");

      // NO navegó
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 2: useLogout
  // ═══════════════════════════════════════════════════════════

  describe("useLogout", () => {
    it("limpia el store y navega a /login", async () => {
      // ARRANGE: partimos de un estado autenticado
      useAuthStore.getState().setAuth(fakeUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      mockLogout.mockResolvedValueOnce(undefined);

      // ACT
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // ASSERT: store limpio
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();

      // Navegó a /login
      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/login",
        replace: true,
      });
    });

    it("aún limpia y navega INCLUSO si signOut falla", async () => {
      // ARRANGE: el logout falla (ej: red caída)
      useAuthStore.getState().setAuth(fakeUser);
      mockLogout.mockRejectedValueOnce(new Error("Network error"));

      // ACT
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate();
      });

      // ASSERT: esperamos a que navigate se llame (efecto de onSettled)
      // ⚡ Esta es la clave del fix que hicimos:
      // onSettled se ejecuta SIEMPRE, éxito o error.
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({
          to: "/login",
          replace: true,
        });
      });

      // ¡Aún así limpió el store!
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});
