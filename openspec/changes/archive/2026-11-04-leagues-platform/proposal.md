## Why

La web actual gestiona una única liga hardcodeada, sin autenticación ni persistencia durable (JSON en disco efímero en Vercel). Queremos escalarla a una plataforma multi-tenant: cualquiera puede crear su liga con su cuenta de Google, gestionarla como owner, y compartir el acceso por una URL legible derivada del título (`/liga-cholos/clasificacion`). El despliegue en Vercel exige además una persistencia real (Supabase).

## What Changes

- **Homepage renovada**: listado público de las ligas creadas (nombre, estado, líder actual o campeón, progreso de jornadas) y botón "Crear liga".
- **Autenticación con email y contraseña** vía Supabase Auth (`@supabase/ssr`, cookies httpOnly) — necesaria para crear y gestionar ligas.
- **Creación de liga** en página aparte (`/crear`): título → slug validado, único e inmutable → redirect al panel de administración.
- **URLs por liga**: las rutas actuales pasan a estar anidadadas bajo el slug (`/[code]/clasificacion`, `/[code]/calendario`, `/[code]/admin`). Lectura pública; escritura solo para el owner.
- **Multi-tenant en todas las capas**: el puerto `LeagueRepository` gana identidad por liga (`findByCode`, `create`, `save`, `list`, `delete`); los casos de uso reciben el código de liga. **BREAKING** para cualquier consumidor del puerto actual `get()`.
- **Persistencia en Supabase**: tabla `leagues` con el agregado `League` serializado en una columna `jsonb`; RLS como red de seguridad (SELECT público, escritura owner). El JSON local (`data/league.json`) queda como opción de desarrollo vía env.
- **Gestión del owner**: eliminar liga (con confirmación), además de las operaciones actuales del panel.
- **Rutas raíz actuales** (`/clasificacion`, `/calendario`, `/admin`) redirigen a la homepage. No se migra el histórico de `data/league.json`: se empieza de cero en Supabase.

Fuera de alcance (futuro cambio `league-commissioners`): roles de comisario, tabla `league_members` e invitaciones por link con token. El diseño actual lo deja preparado (columnas y políticas pensadas para extenderse).

## Capabilities

### New Capabilities
- `league-platform-auth`: autenticación con email y contraseña (Supabase Auth) para crear y gestionar ligas; sesión SSR con cookies httpOnly; logout.
- `league-management`: creación de ligas con título y slug derivado (validación, unicidad, palabras reservadas), galería pública en la homepage, y ciclo de vida del owner (acceso al panel, eliminación de la liga).
- `league-scoped-routes`: rutas públicas de lectura y panel de administración bajo `/[code]/…`, con autorización de escritura exclusiva del owner.

### Modified Capabilities
<!-- No hay specs main vigentes que modificar: la única capability existente (responsive-league-ui) vive en un change archivado sin requisitos afectados por este cambio a nivel de estructura de páginas (se reutilizan los componentes visuales tal cual). -->

## Impact

- **Dominio** (`src/domain`): intacto (el agregado `League` no conoce códigos ni usuarios; Persona ≠ Player).
- **Aplicación** (`src/application`): puerto `LeagueRepository` reescrito (identidad por liga); todos los casos de uso ganan el parámetro `code`; nuevos `CreateLeague`, `ListLeagues`, `DeleteLeague`.
- **Infraestructura** (`src/infrastructure`): `SupabaseLeagueRepository` (jsonb), `JsonFileLeagueRepository` degradado a dev, `container.ts` selecciona adaptador por env; sesión Supabase en `presentation`.
- **Presentación** (`src/app`, `src/presentation`): homepage nueva, `/crear`, `/login` (callback OAuth), rutas anidadas `/[code]/…`, gates de autorización en las 5 server actions mutantes.
- **Dependencias**: `@supabase/supabase-js`, `@supabase/ssr`.
- **Operación**: proyecto Supabase (tabla `leagues` + RLS), OAuth client de Google, env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LEAGUE_DATA_FILE` para dev).
- **Despliegue**: Vercel pasa a ser viable (adiós filesystem efímero).
