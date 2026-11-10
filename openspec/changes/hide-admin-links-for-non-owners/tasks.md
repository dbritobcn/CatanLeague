# Tasks: hide-admin-links-for-non-owners

## 1. Infraestructura de decisión de rol

- [x] 1.1 Crear `src/presentation/auth/canAdmin.ts` con `canAdministerLeague(code)`: sesión inexistente o liga inexistente/ajena → `false`; propietario → `true`. Sin casos de uso nuevos (reutiliza `getSession` + `container.getLeagueInfo`).
- [x] 1.2 Añadir `x-pathname` a la respuesta en `src/proxy.ts` (response headers) manteniendo el matcher y el refresh de sesión intactos.

## 2. Shell de navegación

- [x] 2.1 Convertir `Navigation` en receptor de props: añadir `adminLink?: { href: string; label: string; compact: string }` y que `linksFor` solo incluya «Administración» cuando el prop llegue definido. Mantener cliente, `usePathname`, `aria-current`, iconos y etiquetas compactas.
- [x] 2.2 Hacer `src/app/layout.tsx` async: leer `x-pathname` de `headers()`, detectar primer segmento de liga (reutilizando `RESERVED_SLUGS`), llamar a `canAdministerLeague` y pasar `adminLink` a `Navigation`. Fuera de liga: sin prop ni consulta. Ausencia de cabecera → sin enlace (fallback seguro).

## 3. CTAs de páginas de liga

- [x] 3.1 En `src/app/[code]/clasificacion/page.tsx`: condicionar el `<Link className="button primary-action">` de la cabecera («Añadir participantes» / «Registrar resultado») a `canAdministerLeague(code)`; «Ver partidas» en `finished` se mantiene público. La página ya valida la liga con `requireExistingLeague`.
- [x] 3.2 Pasar `canAdmin` desde la clasificación a `NextRoundBand` y asegurar que ningún elemento de la banda enlaza a `/<code>/admin` para no propietarios; «Ver calendario» permanece para todos.

## 4. Verificación y cierre

- [x] 4.1 Ejecutar `npm test` y `npm run typecheck`; corregir cualquier regresión en la suite existente (dominio y aplicación no se tocan).
- [x] 4.2 Verificación manual con `npm run dev` y tres perfiles: anónimo (sin «Administración» ni CTAs de admin; banda sin CTA a admin), usuario autenticado no propietario (ídem), propietario (enlace, CTAs y banda exactamente como hoy). Comprobar también acceso directo a `/<code>/admin`: anónimo → redirect login; no propietario → 404. (Perfil anónimo verificado por el agente en HTML renderizado + redirect 307 a login; perfiles owner y no-owner confirmados por el propietario en navegador.)
- [x] 4.3 Validar con `openspec validate hide-admin-links-for-non-owners --strict` y confirmar que no se han modificado guards, server actions, RLS ni esquema de Supabase.
