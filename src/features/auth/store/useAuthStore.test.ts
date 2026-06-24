/**
 * ┌─────────────────────────────────────────────────────┐
 * │  TESTS: Auth Store (Zustand)                        │
 * │  Ubicación: src/features/auth/store.test.ts         │
 * └─────────────────────────────────────────────────────┘
 *
 * ¿QUÉ ESTAMOS TESTEANDO?
 *
 * El store de Zustand que mantiene el estado de autenticación
 * en memoria. Es pura lógica — no React, no red, no mocks.
 *
 * ¿POR QUÉ EMPEZAR POR AQUÍ?
 *
 * Buena práctica: empieza testeando las piezas más simples
 * y puras (sin dependencias externas). Si el store tiene un bug,
 * todos los tests de hooks y servicios que dependen de él
 * también van a fallar — así que lo probamos primero.
 *
 * ── ANATOMÍA DE UN TEST ──────────────────────────────────
 *
 * describe("grupo", () => {   ← Agrupa tests relacionados
 *   it("debe hacer X", () => { ← Un caso de prueba individual
 *     // ARRANGE  → preparar el escenario
 *     // ACT      → ejecutar la acción
 *     // ASSERT   → verificar el resultado
 *   });
 * });
 *
 * expect(valor).toBe(esperado)  ← La aserción más básica
 * expect(valor).toBeNull()      ← Verifica que es null
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/useAuthStore";
import type { User } from "@/types";

// ── Datos de prueba ──────────────────────────────────────────
//
// Creamos un usuario "fake" que tenga la misma forma que un
// usuario real de la DB. Usamos `as User` porque no necesitamos
// TODOS los campos para nuestros tests — solo los relevantes.
//
const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  fullname: "Test User",
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
} as User;

describe("Auth Store", () => {
  // ── beforeEach ───────────────────────────────────────────
  //
  // Se ejecuta ANTES de cada `it(...)`.
  // Reseteamos el store para que cada test empiece limpio.
  // Sin esto, un test podría "contaminar" al siguiente.
  //
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 1: Estado inicial
  // ═══════════════════════════════════════════════════════════

  describe("estado inicial", () => {
    it("empieza sin usuario y no autenticado", () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 2: setAuth
  // ═══════════════════════════════════════════════════════════

  describe("setAuth()", () => {
    it("establece el usuario y marca como autenticado", () => {
      // ACT: llamamos setAuth con nuestro usuario fake
      useAuthStore.getState().setAuth(mockUser);

      // ASSERT
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser); // toEqual compara objetos por contenido
    });

    it("puede reemplazar un usuario existente", () => {
      // ARRANGE: primero seteamos un usuario
      useAuthStore.getState().setAuth(mockUser);

      // ACT: lo reemplazamos con otro
      const otherUser = { ...mockUser, id: "user-456", fullname: "Other User" };
      useAuthStore.getState().setAuth(otherUser);

      // ASSERT: el store tiene el nuevo usuario
      expect(useAuthStore.getState().user?.id).toBe("user-456");
      expect(useAuthStore.getState().user?.fullname).toBe("Other User");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 3: clearAuth
  // ═══════════════════════════════════════════════════════════

  describe("clearAuth()", () => {
    it("limpia el usuario y marca como no autenticado", () => {
      // ARRANGE: partimos de un estado autenticado
      useAuthStore.getState().setAuth(mockUser);

      // ACT
      useAuthStore.getState().clearAuth();

      // ASSERT
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // GRUPO 4: Ciclo completo (login → logout → login again)
  // ═══════════════════════════════════════════════════════════

  describe("ciclo completo", () => {
    it("setAuth → clearAuth → setAuth funciona correctamente", () => {
      const { setAuth, clearAuth } = useAuthStore.getState();

      // Login
      setAuth(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);

      // Logout
      clearAuth();
      expect(useAuthStore.getState().user).toBeNull();

      // Login de nuevo (mismo usuario u otro)
      setAuth(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });
});
