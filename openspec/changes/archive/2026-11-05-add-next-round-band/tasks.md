# Tasks

## 1. Capa de aplicación: `currentRound` en `GetSchedule`

- [x] 1.1 Añadir `CurrentRoundView` (`round`, `matches: MatchView[]`) en `src/application/views.ts` (o donde convenga con el resto de los types) como read-model de la jornada en curso.
- [x] 1.2 Derivar `currentRound` en `GetSchedule.execute` y añadirlo al `ScheduleView` retornado: solo en `group_stage`; primera ronda (en orden) con partidas pendientes; `matches` contiene únicamente las pendientes, ordenadas por `number`; `null` en `registration`/`final`/`finished`.
- [x] 1.3 Crear `tests/GetSchedule.test.ts` (patrón del test de contrato existente, repository in-memory sobre `League`) cubriendo: ronda incompleta, resultado fuera de orden (j4 jugada, j3 colgante → round 3), jornada completa → siguiente ronda, y `null` en `registration`/`final`/`finished`.

## 2. Presentación: banda "Próxima jornada"

- [x] 2.1 Crear el componente `NextRoundBand` en `src/presentation/components/` (props: `currentRound: CurrentRoundView`; etiqueta "Mesa A/B/…" derivada del index; nombres como chips; `<Link>` a `/{code}/calendario` "Ver calendario →"; `aria-label="Próxima jornada"`; icono duotone `aria-hidden`).
- [x] 2.2 Integrarlo en `src/app/[code]/clasificacion/page.tsx` entre el hero / sección de campeón y la sección "Clasificación", solo renderizado cuando `status === "group_stage" && currentRound`; heading de la tabla y CTA "Registrar resultado" quedan intactos.
- [x] 2.3 Añadir estilos `.next-round` en `src/app/globals.css` siguiendo la anatomía de `.champion` (icono + bloque + acción derecha al final) y con breakpoint móvil: chips por jugador con wrap, sin overflow horizontal.

## 3. Verificación

- [x] 3.1 `vitest run` en verde (tests nuevos + existentes).
- [x] 3.2 `npm run lint` (o el comando de chequeo equivalente del repo) sin nuevos avisos.
- [x] 3.3 Check manual: con liga en `group_stage` la banda aparece con las mesas pendientes correctas; al registrar la última partida pendiente de la jornada en curso, la banda avanza a la siguiente jornada; en `final`/`finished`/`registration` no aparece; la vista de `/calendario` y el resto de la clasificación son idénticos a hoy.
