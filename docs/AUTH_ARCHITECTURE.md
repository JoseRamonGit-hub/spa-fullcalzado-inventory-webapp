# Arquitectura de Autenticación — Supabase + TanStack Router

## Principio Fundamental

> **Supabase es la fuente de verdad de la sesión.** El estado local (Zustand con `persist`) es un caché de acceso instantáneo y soporte offline, que se sincroniza con el servidor en segundo plano de manera robusta.

---

## Flujo Completo

### 1. Inicio de la App (Carga / Refresh)

```text
__root.tsx beforeLoad
  ├── ¿isInitialized? 
  │   ├── No (Primera vez) → Bloquea render y hace `validateSession()`
  │   └── Sí (Hydrated) → Inicia render instantáneo y lanza `validateSession()` en background.
  │
  └── validateSession() = authService.getAuthenticatedProfile()
             ├── getSession() → Fast path (retorna null si no hay JWT local)
             ├── getUser() → Server-validated JWT (lanza error si la red falla)
             └── Si hay perfil: setAuth(profile). Si es inválido: clearAuth().
                 *En caso 'offline' (falla la red), NO hace clearAuth y respeta la sesión en disco.
```

- La hidratación es visualmente instantánea gracias al `localStorage` en Zustand.
- `getUser()` valida la integridad contra Supabase para detectar si el token expiró/fue revocado. Si falla la red, toleramos la lectura local proveyendo la mejor experiencia *Offline-First*.

### 2. Login

```text
useLogin (hooks.ts)
  ├── authService.login(email, password)
  │   ├── supabase.auth.signInWithPassword()
  │   └── query users table → profile
  ├── setAuth(profile) → Zustand actualizado en disco
  └── router.navigate("/inventory")
```

### 3. Logout y Sincronizaciones Externas (Seguridad multinivel)

```text
useLogout (hooks.ts) 
  ├── authService.logout() → supabase.auth.signOut({ scope: 'local' }) (falla sin red)
  └── onSettled() → clearAuth() + navigate("/login")  (Garantía síncrona UI)

Supabase onAuthStateChange (main.tsx)
  ├── SIGNED_OUT → (Logout en otros tabs o externo) clearAuth() + navigate("/login")
  └── TOKEN_REFRESHED → query profile + setAuth(profile) (Silencioso para JWT)
```

> **DOBLE CAPA DE LIMPIEZA:** `useLogout` hace limpieza explícita y síncrona asegurando que el cierre de sesión *funcione incluso si no hay red*. A la vez, el listener de `onAuthStateChange` actúa como capa de control estricto que vigila que si la sesión finaliza en otra pestaña o por otro factor, el cliente actual desconectará correctamente sin quedarse colgado.

### 4. Guardias de Ruta (Route Guards)

| Ruta        | Guard                                              | Tipo                   |
| ----------- | -------------------------------------------------- | ---------------------- |
| `_app.tsx`  | `isAuthenticated === false` → redirect `/login`    | Síncrono (lee Zustand) |
| `_auth.tsx` | `isAuthenticated === true` → redirect `/inventory` | Síncrono (lee Zustand) |
| `index.tsx` | Redirect inteligente basado en `isAuthenticated`   | Síncrono (lee Zustand) |

**Ningún guard hace petición de red.** Todos leen del store, lo cual es instantáneo gracias a `persist`.

---

## Patrones Opcionales e Importantes

### ✅ SÍ persistir el auth con Zustand `persist`

Aunque Supabase guarda la sesión `JWT`, persistir el `User` (el perfil del sistema) usando el middleware `persist` previene los llamados a base de datos de "hidratación" por cada recarga y detiene flasheos en blanco de la interfaz. Los "zombies" *(tokens no válidos mostrándose como vivos)* son prevenidos por la sincronización obligatoria asincrónica ejecutada en `__root.tsx` apenas entra el usuario. 

### ❌ NO uses SOLO `getSession()` para validar la sesión definitiva

```typescript
// MAL — Solo lee la galleta local sin ver si se revocó.
const { data: { session } } = await supabase.auth.getSession();

// BIEN — Utilizar un combo: getSession para early return, y getUser para verificar el truth de servidor.
const { data: { user } } = await supabase.auth.getUser();
```

---

## Archivos Clave

| Archivo                        | Responsabilidad                                      |
| ------------------------------ | ---------------------------------------------------- |
| `lib/supabase.ts`              | Client singleton con `persistSession: true`          |
| `main.tsx`                     | Listener global para `SIGNED_OUT` y refreshs         |
| `__root.tsx`                   | Validaciones síncronas / background sync (Offline)   |
| `features/auth/store.ts`       | Zustand store, persistido en Storage.                |
| `services/authService.ts`      | Capa interactiva resilente para login y profile      |
| `features/auth/login/hooks.ts` | Consumo para Mutation con cache/clear explícito      |
| `routes/_app.tsx`              | Guard: protege rutas autenticadas                    |
| `routes/_auth.tsx`             | Guard: protege rutas públicas (login)                |
| `routes/index.tsx`             | Redirect inteligente `/`                             |

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
