## Context

La app es una Next.js (App Router) hexagonal que hoy gestiona UNA liga implícita: `LeagueRepository.get()/save()` sin identidad, auth inexistente, web con contenido dinámico (`force-dynamic`), UI recién renovada (change `professional-league-design`, completado). El despliegue objetivo es Vercel, lo que hace inviable `data/league.json` en producción. La decision de producto es convertir la web en plataforma multi-tenant de ligas, con Supabase (cuenta ya existente) y cuentas de Google. Este diseño recoge las decisiones tomadas en explore: galería pública "jugosa", slug derivado del título (rechazo en colisión, no auto-sufijo), página de crear aparte, eliminar liga por el owner, empezar de cero en Supabase, y dejar los comisarios para un cambio posterior (`league-commissioners`).

## Goals / Non-Goals

**Goals:**
- Multi-tenant end-to-end: cualquier usuario Google crea ligas, las gestiona como owner, y las comparte por URL legible `/<slug>/…`.
- Persistencia durable en Supabase (Postgres) viable en Vercel.
- Lectura pública de clasificación/calendario por slug; escritura exclusiva del owner.
- Mantener intactos el dominio (`League`, `ScheduleGenerator`, scoring) y el lenguaje visual de la UI existente.

**Non-Goals:**
- Roles de comisario, `league_members`, invitaciones (→ cambio futuro `league-commissioners`).
- Migración del histórico de `data/league.json` (se empieza de cero).
- Edición del título de la liga tras la creación.
- Identidad de usuarios dentro del agregado (`Persona ≠ Player` se mantiene: el dominio no conoce cuentas).
- Rate-limiting específico de la creación de ligas.

## Decisions

### D1. Modelo de datos: una fila por liga con el agregado en `jsonb`

```sql
public.leagues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,        -- slug, ej. 'liga-cholos' (inmutable)
  name        text NOT NULL,               -- título tal cual lo escribió el usuario
  owner_id    uuid NOT NULL REFERENCES auth.users,
  data        jsonb NOT NULL,              -- LeagueSnapshot (status, players, matches)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON leagues (created_at DESC); -- orden del listado
```

**Por qué jsonb y no tablas normalizadas:** el agregado `League` se lee entero, se escribe entero y las clasificaciones las calcula el dominio (`calculateStandings`), no SQL. Normalizar obligaría a reescribir dominio/repositorio para ganar consultas que hoy no existen. La serialización reutiliza `toSnapshot()/fromSnapshot()` tal cual.

**RLS (red de seguridad, no frontera única):**

```sql
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
CREATE POLICY leagues_select ON leagues FOR SELECT USING (true);      -- galería pública
CREATE POLICY leagues_insert ON leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY leagues_update ON leagues FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY leagues_delete ON leagues FOR DELETE USING (auth.uid() = owner_id);
```

La frontera activa es el gate en las server actions (D5); el RLS protege contra bypass de la app (cualquier client ajeno que escriba directamente en la BD sin ser el owner es rechazado por las políticas). El repositorio de datos usa el client service-role server-side (ver D3), que por diseño de Supabase no está sujeto a RLS.

### D2. Slug derivado del título, con rechazo en colisión (no auto-sufijo)

Tubería determinista `title → slug`:

1. `normalize('NFD')` + strip diacríticos (`Liga Chólos` → `liga cholos`); `ñ` → `n`.
2. Todo lo que no sea `[a-z0-9]` → `-`.
3. Colapsar guiones repetidos/iniciales/finales.
4. Validar longitud 3–60; si queda vacío o < 3 → error de validación ("elige otro nombre").
5. Rechazar slugs reservados (colisionarían con rutas estáticas de primer nivel): `crear`, `login`, `logout`, `invitar`, `admin`, `api`, `auth`… (lista en un array único y testeado).
6. Unicidad: `SELECT exists(code)` + constraint `UNIQUE` en Postgres como red de seguridad; en colisión → error "ese nombre ya está cogido" (sin auto-sufijo: la URL debe ser fiel al título compartido de viva voz).

`code` es **inmutable** tras la creación aunque `name` fuese editable algún día. Al eliminar una liga, el slug queda liberado (los grupos reciclan nombres por temporada). La generación vive en `src/presentation` del lado servidor únicamente (validación autoritativa server-side; el preview en vivo del form es cosmético).

### D3. Auth: Supabase Auth con email y contraseña, `@supabase/ssr`

- Cookies httpOnly (sin tokens en localStorage), patrón oficial para App Router: `createServerClient` (RSC/actions) y `proxy.ts` para el refresco de sesión (Next 16 renombró `middleware` a `proxy`).
- `/login` ofrece un formulario email + contraseña con conmutador "Entrar / Crear cuenta". Las server actions `loginAction` (`signInWithPassword`) y `signUpAction` (`signUp`, con auto-login tras el registro) fijan la cookie y redirigen al destino (`next` saneado: solo rutas absolutas same-origin). `logoutAction` cierra la sesión.
- Se eligió email + contraseña en lugar de OAuth (Google): cero configuración externa (el provider de email viene activado por defecto en Supabase), sin consola de Google ni callback OAuth, y elimina el problema de construir `redirectTo` absoluto desde una server action. "Confirm email" se desactiva en el proyecto para que el registro entre directamente: el email no autoriza nada (solo es la llave de login), así que no verificarlo no abre superficie.
  - Alternativas descartadas: Google OAuth (fricción de setup en Google Cloud Console), magic link (límites de envío del email integrado en el free tier), GitHub/teléfono (fricción para los usuarios / requiere proveedor de pago).
- Helper `getSession()` en `presentation`; el dominio y los use cases **desconocen** la existencia de usuarios (Persona ≠ Player). La única filtración permitida de identidad es `owner_id` al crear la fila.
- El repositorio Supabase usa un client **service-role creado perezosamente y solo server-side** (RLS activo como red de seguridad para accesos directos a la BD; la frontera activa es el gate de las actions).
- Env vars: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (nuevo nombre de las publishable `sb_publishable_…`; se acepta el legado `SUPABASE_ANON_KEY` como fallback) y `SUPABASE_SERVICE_ROLE_KEY` (secret key `sb_secret_…`).

### D4. Puerto y use cases: la identidad de liga cruza todas las capas (mecánico pero ancho)

```ts
// antes
interface LeagueRepository { get(): Promise<League>; save(league: League): Promise<void>; }
// después
interface LeagueRepository {
  findByCode(code: string): Promise<LeagueEntity | null>;   // entity = liga + metadatos
  create(input: { code, name, ownerId }): Promise<LeagueEntity>;
  save(code: string, league: League): Promise<void>;
  list(): Promise<LeagueSummary[]>;                          // galería: name, status, líder/campeón, progreso
  delete(code: string): Promise<void>;
}
```

- Todos los use cases existentes (`AddPlayer`, `StartLeague`, …) ganan `code` como primer parámetro.
- Nuevos: `CreateLeague` (valida tube del slug + unicidad), `ListLeagues`, `DeleteLeague`.
- `LeagueRepository` devolverá `{ code, name, ownerId, league }`; el snapshot jsonb se mapea con `League.fromSnapshot`. El `code` NO entra al agregado: el dominio sigue sin saberlo.
- `ListLeagues` no carga agregados completos para divorced rendering — el summary se calcula con una proyección SQL ligera sobre `data` jsonb (status, played/total, líder) para escalar cuando haya decenas de ligas.

### D5. Rutas y autorización: `/[code]/*` + gates explícitos en actions

```
/                        homepage: galería "jugosa" + botón Crear
/crear                   gate login → form título (preview del slug) → create → redirect /<slug>/admin
/login                   involuntary OAuth entry point (y callback de vuelta)
/[code]/clasificacion    pública
/[code]/calendario       pública
/[code]/admin            requiere ownership
(legacy) /clasificacion, /calendario, /admin → redirect(307) a /
```

- **Server actions = frontera real** (cualquiera puede POSTear un action ID sin visitar la página): las 5 mutantes (`addPlayer`, `removePlayer`, `startLeague`, `restartLeague`, `recordResult`) ejecutan `requireLeagueOwner(code)` primero; sin sesión o sin ownership → error/redirect. La página `/[code]/admin` repite el gate (defense in depth).
- Auth helpers en `src/presentation/auth/`; el middleware solo hace refresh de sesión (no gatea render: páginas públicas + `force-dynamic`).
- Logout action para salir desde el admin.

### D6. Selector de repositorio por entorno

`container.ts` elige `SupabaseLeagueRepository` por defecto; con `LEAGUE_PERSISTENCE=file` (dev y tests) usa `JsonFileLeagueRepository` (que aprenderá a hablar multi-liga con un directorio `data/leagues/<code>.json`). `InMemoryLeagueRepository` de tests pasa a `Map<code, League>`. La interfaz es idéntica, así que los tests de dominio no cambian.

## Risks / Trade-offs

- [Reescritura ancha y mecánica de todas las capas] → Partir en tasks verticales (repo → use cases → actions → rutas), tests de contrato del puerto (`LeagueRepositoryContract`) que validan ambos adaptadores con las mismas expectativas.
- [Slug inmutable + galería pública = nombres "cogidos" por ligas abandonadas] → Asumido: el owner puede eliminar la liga y liberar el slug; escala-amigos lo tolera.
- [`updated_at` no cambia solo con jsonb] → `save()` lo settea explícitamente en el UPDATE.
- [Escrituras concurrentes sobre el mismo jsonb (last-write-wins)] → Aceptado de partida: en la práctica muta una persona (owner). Futuro: `data` con versión optimista si aparecen comisarios.
- [Quota del plan gratuito de Supabase / pausas del proyecto] → Riesgo operativo asumido; el selector D6 permite volver al JSON local si hiciera falta.
- [Colisión URL estática/dinámica si un slug reserva mal] → Lista de palabras reservadas cubierta por tests; Next resuelve rutas estáticas antes que `[code]`.
- [Sin verificación de email al registrarse (Confirm email desactivado)] → Asumido: el email no autoriza nada en la app (solo es credencial de login); los permisos dependen del ownership. Un email falso solo encierra al propio usuario fuera si olvida la contraseña.
- [OAuth descartado en favor de email+contraseña] → Menor fricción de setup (provider de email activo por defecto, sin consola Google ni callback); si en el futuro se quiere Google/otro provider, Supabase lo añade sin tocar dominio ni repositorio.

## Migration Plan

1. Crear tabla `leagues` + políticas RLS en Supabase (script SQL versionado en el repo, ej. `supabase/migrations/…`).
2. En el proyecto Supabase: desactivar "Confirm email" (Authentication → Sign In / Up → Email) para que el registro entre directamente.
3. Deploy: las rutas legacy redirigen a `/`; no hay datos que migrar (se empieza de cero).
4. Rollback: revertir deploy; los datos de Supabase permanecen intactos para otro intento.

## Open Questions

- ¿Preview en vivo del slug en `/crear` con validación client-side espejo (misma tubería compartida en un módulo)? — Recomendación: sí, ioctl puro compartido; se resuelve en implementación.
- ¿Orden del listado de la galería: recién creadas primero o por actividad (`updated_at`)? — Recomendación: `created_at DESC`, revisable tras uso real.
