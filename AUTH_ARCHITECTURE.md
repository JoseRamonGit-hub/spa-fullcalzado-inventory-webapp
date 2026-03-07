# Arquitectura de Autenticación — Supabase + TanStack Router

## Principio Fundamental

> **Supabase es la fuente de verdad de la sesión.** El estado local (Zustand) es un espejo sincronizado.

---

## Flujo Completo

### 1. Inicio de la App (Carga / Refresh)

```
__root.tsx beforeLoad
  ├── ¿isInitialized? → Sí → Saltar (ya se validó)
  └── No → authService.getAuthenticatedProfile()
             ├── getUser() → server-validated JWT
             ├── query users table → profile
             └── setAuth(profile) ó clearAuth()
```

- `getUser()` valida el JWT contra el servidor de Supabase (NO confiamos en `getSession()`)
- Si falla (red caída, token expirado), se hace `clearAuth()` → el usuario ve `/login`
- **Solo ocurre una vez** por carga completa de página

### 2. Login

```
useLogin (hooks.ts)
  ├── authService.login(email, password)
  │   ├── supabase.auth.signInWithPassword()
  │   └── query users table → profile
  ├── setAuth(profile) → Zustand actualizado
  └── router.navigate("/inventory")
```

### 3. Logout — LA PARTE CRÍTICA

```
useLogout (hooks.ts) ─── SOLO dispara ───→ authService.logout()
                                            │
                                            ▼
                                supabase.auth.signOut({ scope: 'local' })
                                            │
                                            ▼ (Supabase siempre limpia localStorage)
                                            │
                                onAuthStateChange → SIGNED_OUT
                                            │
                                 ┌──────────┴──────────┐
                                 │                     │
                            clearAuth()         queryClient.clear()
                                 │
                        router.navigate("/login")
```

> **REGLA DE ORO:** `useLogout` NO hace limpieza local, NO navega. Solo dispara `signOut()`.
> La limpieza y navegación ocurre **exclusivamente** en `onAuthStateChange` de `main.tsx`.

### 4. Guardias de Ruta (Route Guards)

| Ruta        | Guard                                              | Tipo                   |
| ----------- | -------------------------------------------------- | ---------------------- |
| `_app.tsx`  | `isAuthenticated === false` → redirect `/login`    | Síncrono (lee Zustand) |
| `_auth.tsx` | `isAuthenticated === true` → redirect `/inventory` | Síncrono (lee Zustand) |
| `index.tsx` | Redirect inteligente basado en `isAuthenticated`   | Síncrono (lee Zustand) |

**Ningún guard hace llamada de red.** Todos leen del store que ya fue hidratado por `__root.tsx`.

---

## Errores Comunes a Evitar

### ❌ NO hagas cleanup local en el hook de logout

```typescript
// MAL — causa race condition con onAuthStateChange
export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: async () => {
      clearAuth(); // ← DUPLICADO
      await router.navigate("/login"); // ← COMPITE CON onAuthStateChange
    },
  });
}
```

```typescript
// BIEN — fire-and-forget
export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout(),
    // onAuthStateChange maneja TODO el cleanup
  });
}
```

### ❌ NO uses `getSession()` para validar sesión

```typescript
// MAL — getSession() lee el JWT local sin validar
const {
  data: { session },
} = await supabase.auth.getSession();

// BIEN — getUser() valida contra el servidor
const {
  data: { user },
} = await supabase.auth.getUser();
```

### ❌ NO persistir estado auth con Zustand `persist`

El store es **in-memory only**. La sesión real la persiste Supabase internamente (localStorage).
Si usas `persist()` de Zustand, puedes crear "sesiones zombie" donde el estado local dice que hay sesión pero Supabase ya la revocó.

### ❌ NO hacer múltiples llamadas de red en guards de rutas

```typescript
// MAL — cada ruta llama a getUser()
beforeLoad: async () => {
  const profile = await authService.getAuthenticatedProfile();
  // ...
};

// BIEN — solo __root.tsx llama a getUser(), el resto lee el store
beforeLoad: () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) throw redirect({ to: "/login" });
};
```

---

## Archivos Clave

| Archivo                        | Responsabilidad                                      |
| ------------------------------ | ---------------------------------------------------- |
| `lib/supabase.ts`              | Client singleton con `persistSession: true`          |
| `main.tsx`                     | `onAuthStateChange` — único listener de eventos auth |
| `__root.tsx`                   | Hidratación inicial via `getUser()`                  |
| `features/auth/store.ts`       | Zustand store (in-memory, sin persist)               |
| `services/authService.ts`      | login, logout, getAuthenticatedProfile               |
| `features/auth/login/hooks.ts` | useLogin, useLogout (React Query mutations)          |
| `routes/_app.tsx`              | Guard: protege rutas autenticadas                    |
| `routes/_auth.tsx`             | Guard: protege rutas públicas (login)                |
| `routes/index.tsx`             | Redirect inteligente `/` → `/inventory` o `/login`   |

---

## Configuración de Supabase Client

```typescript
export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true, // Persiste en localStorage
    storageKey: "supabase-auth-storage",
    autoRefreshToken: true, // Refresh automático antes de expirar
    detectSessionInUrl: false, // No estamos usando OAuth redirect
  },
});
```
