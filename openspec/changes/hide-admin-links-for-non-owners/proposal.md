# Proposal: hide-admin-links-for-non-owners

## Why

Hoy la navegación dentro de una liga (`Navigation`) muestra el enlace «Administración» a todos los visitantes, incluidos los anónimos y los usuarios que no son propietarios de la liga. Para ellos el enlace está muerto: lleva al login y, tras iniciar sesión, a un 404 (las ligas ajenas se ocultan como inexistentes). El acceso a `/<code>/admin` está correctamente protegido por los guards y las server actions; el problema es puramente de UX y de superficie expuesta: el panel de administración se anuncia a quien no puede usarlo. Lo mismo ocurre con otros enlaces al panel dispersos por las páginas públicas de la liga.

## What Changes

- El enlace «Administración» de la navegación lateral solo se mostrará al propietario de la liga.
- Los demás enlaces a `/<code>/admin` dispersos en las páginas de la liga (CTA «Añadir participantes» y «Registrar resultado» de la clasificación, y el CTA del band de próxima jornada) también se condicionan al propietario: los visitantes no propietarios no verán **ningún** botón de administración (decisión de producto: en `group_stage` no se muestra botón sustituto).
- El cálculo de «puede administrar» se resolverá en el servidor (get session + ownerId de `GetLeagueInfo`) y llegará a la UI como prop con esa intención, dejando un único punto (`canAdmin`) donde una futura co-administración (invitar admins) solo tenga que cambiar esa función.
- No cambia nada de la frontera de seguridad: el acceso directo a `/<code>/admin` por URL mantiene el comportamiento actual (redirect a login si anónimo, 404 si no propietario). Este cambio es solo visibilidad de enlaces.

## Capabilities

### New Capabilities

- `admin-link-visibility`: visibilidad de los enlaces al panel de administración según el rol del visitante frente a la liga (hoy: propietario; el punto de extensión queda definido para futuros admins invitados).

### Modified Capabilities

- `next-round-band`: el CTA «Registrar resultado» (enlace a `/<code>/admin#resultados`) pasa de incondicional a visible solo para el propietario; el resto del requisito de la banda no cambia.

## Impact

- **Presentación**: `src/presentation/components/Navigation.tsx` (pasa de derivar enlaces solo del pathname a recibir datos de visibilidad), `src/presentation/components/NextRoundBand.tsx` (CTA condicional), `src/app/[code]/clasificacion/page.tsx` (CTA condicional), posiblemente `src/app/layout.tsx` (composición server → props a Navigation).
- **Aplicación**: `GetLeagueInfo` ya expone `ownerId`; la comparación `session.user.id === ownerId` se encapsula en un único helper de presentación.
- **Seguridad**: sin cambios en `requireLeagueOwner` (actions) ni `requireLeagueAdmin` (guards) ni RLS — siguen siendo la frontera real.
- **Specs**: nueva capability `admin-link-visibility`; delta sobre `next-round-band` (CTA condicionado al propietario). No se toca `league-scoped-routes` (la ruta `/admin` sigue owner-only; este cambio no altera el acceso).
- **Fuera de alcance**: el flujo completo de admins invitados (quién, cómo se invita, revocación) queda para un cambio futuro; se cita solo como extensión prevista del punto `canAdmin`.
