# Design: hide-admin-links-for-non-owners

## Context

La UI de liga se compone de un shell global (`src/app/layout.tsx` renderiza `Navigation`, un componente cliente que deriva sus enlaces del pathname) y páginas públicas por liga. Hoy `Navigation` muestra «Administración» dentro de cualquier liga para todo visitante, aunque el accès real esté protegido por `requireLeagueAdmin` (guards de página), `requireLeagueOwner` (server actions) y RLS en Supabase. Para anónimos y no propietarios, el enlace termina en login → 404. Además existen CTAs hacia el panel en `clasificacion/page.tsx` («Añadir participantes» / «Registrar resultado») y en `NextRoundBand` («Ver calendario» es público; no hay CTA a admin en el componente actual — el CTA de registro es el botón de la cabecera de la clasificación).

Decisiones de producto ya tomadas: dirección A1 (server → props del cliente), sin botón sustituto para visitantes, y Feature B (admins invitados) congelado como futuro.

## Goals / Non-Goals

**Goals:**

- Ocultar «Administración» de la navegación lateral y todos los CTAs al panel para visitantes no propietarios (anónimos incluidos).
- Calcular la visibilidad en el servidor con la sesión real, en un único punto reutilizable.
- Dejar preparado el seam para co-administración futura: una sola función decide «puede administrar».
- Cero cambios en la frontera de seguridad (guards, actions, RLS).

**Non-Goals:**

- Invitaciones, roles adicionales o co-administración (Feature B, aplazado).
- Cambiar el comportamiento del acceso directo a `/<code>/admin` (sigue redirect/404).
- Añadir botones sustitutos para visitantes en `group_stage`.
- Modificar la RLS ni el esquema de Supabase.

## Decisions

### 1. Dónde vive la lógica: no tocar el middleware ni el root layout global

`Navigation` se renderiza en `src/app/layout.tsx` (fuera del segmento `[code]`), y no existe `[code]/layout.tsx`. Opciones consideradas:

- **(a) Middleware inyecta `x-pathname` en una cabecera de respuesta y el root layout la lee** para saber si está en una liga, consulta la sesión y pasa `canAdmin` a `Navigation` por props.
- **(b) Crear `src/app/[code]/layout.tsx`** que renderiza una navegación de liga (server) reutilizando `Navigation` como pieza, sustituyendo la global dentro de las rutas de liga.
- **(c) Intentar leer `headers()` / pathname en el root layout** — no expone el pathname de forma fiable en Next 16.

Se elige **(a)** por ser la menos invasiva: el shell único se conserva (una sola declaración de sidebar, sin dividir CSS ni duplicar markup) y el coste es una consulta de sesión + `GetLeagueInfo` por render de página de liga, ambas cacheadas por request. El matcher actual de `src/proxy.ts` ya cubre todas las rutas de página; basta añadir `response.headers.set("x-pathname", request.nextUrl.pathname)` en la respuesta final.

Alternativa descartada formalmente: filtrar con CSS o client-side fetching del rol — la decisión debe nacer en el servidor para no parpadear enlaces ni exponer lógica de autorización al cliente.

### 2. El cálculo del rol: helper único de presentación

Nuevo módulo `src/presentation/auth/canAdmin.ts`:

```ts
export async function canAdministerLeague(code: string): Promise<boolean>
```

- `getSession()` (ya existe en `src/presentation/auth/server.ts`) → si no hay sesión: `false`.
- `container.getLeagueInfo.execute(code)` (ya devuelve `ownerId`) → compara con `user.id`. Errores de liga (404 interno) → `false`.
- Sin casos de uso nuevos: la composición existente basta. El día que llegue el Feature B, solo esta función cambia (p. ej. consultando `adminIds`), y ningún componente de UI se entera.

### 3. Cómo llega el dato a `Navigation`: props desde el root layout

Root layout pasa a async, y:

- Lee `x-pathname` de `headers()` (establecida por el proxy). Primer segmento no reservado ⇒ estamos en una liga.
- Si es liga: `const canAdmin = await canAdministerLeague(code)` y `const [href, label] = canAdmin ? [`/${code}/admin`, "Administración"] : null`.
- `Navigation` pasa a recibir prop opcional `adminLink?: { href: string; label: string }`; su `linksFor(pathname)` la consume si está definida. Sigue siendo cliente (usa `usePathname` para `aria-current`), pero ya no inventa el enlace.

Caché: las páginas de liga ya son `force-dynamic` (p. ej. clasificación) o dependen de datos por request; la consulta extra vive en el mismo request de render, sin duplicar llamadas de sesiones repetidas (Next deduplica `fetch` de Supabase por request en server components).

### 4. CTAs de `clasificacion/page.tsx` y banda

- Clasificación: el bloque `<Link className="button primary-action">` («Añadir participantes» / «Registrar resultado») se condiciona a `canAdmin`; para visitantes no propietarios no se renderiza (la cabecera ya tiene estructura flexible; el hueco se reabsorbe). «Ver partidas» en `finished` es un enlace público al calendario y se mantiene para todos.
- `NextRoundBand` no contain enlace a admin actualmente; se le pasa `canAdmin?: boolean` para que el CTA de registrar (si se añade o ya existe una variante futura) se rinda condicionalmente — se implementa como prop del componente usado por la clasificación para el CTA del band conforme al spec modificado («no renderiza CTA hacia admin para visitantes»). El enlace «Ver calendario» es público y se mantiene para todos.
- Los guards (`requireExistingLeague`, `requireLeagueAdmin`) y `actions.ts` no se tocan.

### 5. Estrategia de tests

Los componentes de presentación no tienen suites de unit tests hasta hoy (suite existente: dominio + aplicación). Por alcance y valor real:

- Test de aplicación del helper `canAdministerLeague`... al pertenecer a presentación, se prueba con tests de componente/página solo si el coste es bajo; lo esencial (visitor → sin enlace) se verifica manualmente y con typecheck/test suite existente pasando.
- `npm run typecheck` + `npm test` verificados en el flujo de implementación.
- Verificación manual documentada en tasks: owner ve enlace+CTAs; anónimo y no-owner no ven nada de admin; acceso directo mantiene redirect/404.

## Risks / Trade-offs

- [Root layout pasa a async y consulta por render de liga] → Coste acotado a una `getSession` + un `GetLeagueInfo` por request; acceptable para páginas ya dinámicas. Si algún día duelen, se cachea por (code, user) en memo de request.
- [Falsos «Administración» si la cabecera `x-pathname` falta (p. ej. request sin middleware)] → `canAdministerLeague` tolera ausencia devolviendo `false`: fallback seguro, nunca muestra el enlace por defecto.
- [Next 16 convención proxy podría no ejecutarse en todos los entornos] → el matcher ya está activo en dev y producción; riesgo idéntico al refresh de sesión que ya vive ahí.
- [Divergencia entre visibilidad y frontera real] → La visibilidad es cosmética por diseño; guards y actions siguen siendo obligatorios. Se documenta en el spec (`admin-link-visibility`, escenario de acceso directo inalterado).

## Migration Plan

1. Implementar helper + proxy header + props de `Navigation` + CTAs condicionales.
2. Verificar suite (`npm test`, `typecheck`) y verificación manual con `npm run dev` y tres perfiles (anónimo, no-owner, owner).
3. Desplegar — sin migraciones, sin cambios de datos ni de esquema.
4. Rollback: revert del commit restaura el enlace para todos (sin datos migrados).

## Open Questions

Ninguna pendiente para este alcance. El Feature B (co-administración por invitación) queda como cambio futuro con su seam listo (`canAdministerLeague`).
