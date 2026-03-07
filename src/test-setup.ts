/**
 * ┌─────────────────────────────────────────────────────┐
 * │  TEST SETUP — se ejecuta ANTES de cada test file    │
 * │  Configura los mocks globales que todos los tests   │
 * │  necesitan (Supabase client, DOM matchers, etc.)    │
 * └─────────────────────────────────────────────────────┘
 *
 * ¿POR QUÉ NECESITAMOS ESTO?
 *
 * Nuestro código real importa `supabase` desde "@/lib/supabase",
 * que crea una conexión real a Supabase. En tests, NO queremos
 * hacer llamadas reales a la red — queremos simular (mock)
 * las respuestas para probar la lógica de nuestra app.
 *
 * `vi.mock(...)` intercepta el import y lo reemplaza por
 * funciones fake que nosotros controlamos desde cada test.
 */

import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// ─── Mock del cliente Supabase ────────────────────────────────
//
// `vi.mock("@/lib/supabase", ...)` le dice a Vitest:
// "Cuando CUALQUIER archivo importe '@/lib/supabase',
//  dale este objeto fake en vez del real."
//
// Las funciones están como `vi.fn()` — funciones spy que:
// 1. No hacen nada por defecto (retornan undefined)
// 2. Registran cada vez que las llaman (podemos verificar con `.toHaveBeenCalled()`)
// 3. Podemos cambiar su retorno con `.mockResolvedValue()` en cada test
//
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// ─── Mock de sonner (toast notifications) ─────────────────────
//
// Nuestro useLogin llama `toast.error()` cuando falla el login.
// Necesitamos un mock para verificar que se llamó.
//
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// ─── Mock de TanStack Router ──────────────────────────────────
//
// Los hooks useLogin/useLogout usan `useRouter()` para navegar.
// Creamos un router fake con un `navigate` spy.
//
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate: mockNavigate }),
  createRouter: vi.fn(),
}));

// Exportamos para que los tests puedan verificar las llamadas
export { mockNavigate };
