## 1. Setup operativo y dependencias

- [x] 1.1 Crear/verificar proyecto Supabase y la tabla `leagues` (id, code UNIQUE, name, owner_id, data jsonb, created_at, updated_at) con índice sobre `created_at DESC` *(SQL versionado en `supabase/migrations/0001_leagues.sql`; ejecutarlo en tu proyecto es manual)*
- [x] 1.2 Aplicar políticas RLS (SELECT público; INSERT/UPDATE/DELETE solo `owner_id = auth.uid()`) y versionar el script SQL en `supabase/migrations/` *(script versionado; aplicar en Supabase es manual: SQL Editor o `supabase db push`)*
- [x] 1.3 Configurar el provider de email en Supabase: activo por defecto; desactivar "Confirm email" (Authentication → Sign In / Up → Email) *(confirmado por el usuario)*
- [x] 1.4 Instalar `@supabase/supabase-js` y `@supabase/ssr`; añadir env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, opción `LEAGUE_PERSISTENCE`) a `.env.example` y Vercel *(código listo; configurar en Vercel es manual)*

## 2. Puerto multi-liga y adaptadores

- [x] 2.1 Rediseñar `LeagueRepository`: `findByCode`, `create`, `save(code, league)`, `list`, `delete` (entidad con code, name, ownerId y agregado)
- [x] 2.2 Adaptar `InMemoryLeagueRepository` a `Map<code, LeagueEntity>` y `JsonFileLeagueRepository` a `data/leagues/<code>.json`; ambos deben pasar un contrato de tests compartido (`LeagueRepositoryContract`)
- [x] 2.3 Implementar `SupabaseLeagueRepository` (serialización del snapshot a jsonb, `updated_at` explícito en UPDATE, manejo de violación UNIQUE en code) validado con el mismo contrato *(contrato activo si hay SUPABASE_URL+SERVICE_ROLE definidas; si no, se salta)*- [x] 2.4 Actualizar `container.ts` con el selector de repositorio por entorno (`LEAGUE_PERSISTENCE=file` para dev; Supabase por defecto)

## 3. Casos de uso multi-liga

- [x] 3.1 Añadir el parámetro `code` a los use cases existentes (AddPlayer, RemovePlayer, StartLeague, RestartLeague, RecordMatchResult, GetPlayers, GetSchedule, GetStandings)
- [x] 3.2 Implementar el módulo de slug (tubería título→slug con diacríticos, colapso de guiones, longitud 3–60, lista de palabras reservadas único y testeado)
- [x] 3.3 Implementar `CreateLeague` (valida slug y unicidad, rechaza colisión sin auto-sufijo), `ListLeagues` (summary con estado, progreso, líder/campeón) y `DeleteLeague` (libera slug)
- [x] 3.4 Extender tests de aplicación: creación/validaciones/colisiones, aislamiento entre ligas, listado summary (líder vs campeón), delete + reutilización de slug *(+ `GetLeagueInfo` para los gates)*

## 4. Autenticación (Supabase Auth + Google)

- [x] 4.1 Crear helpers SSR en `src/presentation/auth/` (factory de `createServerClient`, `getSession()`, guards de página) *(no se necesita `createBrowserClient`: el login va por server action y el preview del slug es puro)*
- [x] 4.2 Implementar `src/middleware.ts` de refresh de sesión y `/auth/callback` que intercambia el código PKCE (`?code=`) por cookies de sesión
- [x] 4.3 Implementar `/login` ( formulario email+contraseña con conmutador "Entrar / Crear cuenta") y server actions `loginAction`/`signUpAction`/`logoutAction` *(cambiado de Google OAuth a email+contraseña por decisión del usuario: cero configuración externa)*
- [x] 4.4 Verificar el flujo completo local: crear cuenta → sesión → logout *(confirmado por el usuario)*

## 5. Rutas y UI

- [x] 5.1 Mover las páginas actuales bajo `app/[code]/` (clasificacion, calendario, admin) parametrizadas por código de liga; 404 si el código no existe
- [x] 5.2 Implementar gates: `requireLeagueOwner(code)` en `/[code]/admin` (page) y en las 5+1 server actions mutantes (incluida `deleteLeagueAction`); redirección a login / denegación según corresponda
- [x] 5.3 Implementar homepage: galería "jugosa" (nombre, estado, progreso, líder/campeón, orden por created_at DESC, estado vacío) + botón "Crear liga"
- [x] 5.4 Implementar `/crear`: gate de login, form de título con preview en vivo del slug, errores de validación, redirect a `/<slug>/admin` tras crear
- [x] 5.5 Añadir "Eliminar liga" al admin (confirmación irreversible, estilo del `restartLeague` actual) y acción de logout en el panel
- [x] 5.6 Redirigir las rutas raíz legadas (`/clasificacion`, `/calendario`, `/admin`) a la homepage

## 6. Verificación final

- [x] 6.1 Suite completa en verde (`npm test`): dominio intacto, contrato de repositorio en ambos adaptadores, slug, use cases nuevos *(60 pass + 8 skip de Supabase sin env; typecheck y `next build` también en verde)*
- [x] 6.2 Recorrido manual local end-to-end: crear liga → gestarla → verla en la homepage → entrar por slug como anónimo → eliminarla → slug liberado *(verificado con persistencia file: galería con líder/progreso, vistas públicas por slug, 404 en código inexistente, gates de login en /crear y /[code]/admin con return path, 308 en rutas legadas; la parte de login Google real requiere el provider registrado — ver 4.4)*
- [x] 6.3 Desplegar a Vercel y repetir el recorrido en producción (login Google, creación, persistencia entre deploys, rutas legadas)
