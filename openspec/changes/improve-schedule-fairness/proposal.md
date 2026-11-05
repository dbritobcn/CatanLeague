## Why

El calendario actual permite parejas que comparten todas sus partidas: en la liga de 10 participantes de referencia, Theresa y David coinciden en sus cuatro encuentros, por lo que la ausencia de uno impide jugar al otro. Esto no es necesario para satisfacer las reglas: se ha verificado un calendario de 10 partidas, cuatro por jugador y cobertura de todas las parejas, en el que ninguna pareja coincide más de dos veces.

## What Changes

- Incorporar una fase determinista y acotada de mejora de equidad entre el equilibrado de participaciones y la asignación de jornadas.
- Priorizar menos parejas acopladas, menor máximo de encuentros por pareja y menor concentración de repeticiones, sin empeorar la puntuación conjunta respecto al calendario base.
- Garantizar para 10 participantes exactamente 10 partidas, cuatro por jugador y entre uno y dos encuentros por pareja: 30 parejas se encuentran una vez y 15 se encuentran dos veces.
- Conservar las reglas de validez: cuatro participantes distintos por mesa, todas las parejas cubiertas, mesas únicas, participaciones equilibradas y nadie en dos mesas de la misma jornada. La mejora no añade partidas ni cambia las participaciones individuales del calendario base.
- Mantener calendarios existentes intactos. Una liga sin resultados podrá obtener el nuevo calendario mediante las acciones actuales «Reiniciar liga» e «Iniciar liga», después del despliegue.

## Capabilities

### New Capabilities

- `schedule-fairness`: criterios verificables de equidad al generar calendarios, garantía concreta para 10 jugadores y mejora acotada sin regresiones para los tamaños admitidos.

### Modified Capabilities

Ninguna. Las especificaciones actuales no establecen requisitos sobre la distribución de repeticiones entre parejas.

## Impact

- Dominio: `src/domain/services/BalancedCoveringScheduleGenerator.ts` y un posible servicio auxiliar de optimización; la interfaz `ScheduleGenerator` y `League.assertValidGroupStage` no necesitan cambios.
- Tests: regresión del caso de 10 jugadores, validez y no regresión para 5–24 participantes, determinismo, límites de búsqueda e integración de inicio/reinicio.
- Documentación: explicar las garantías, sus límites y cómo regenerar voluntariamente una liga sin resultados.
- Sin cambios en UI, autorización, persistencia, dependencias externas ni migraciones. Fuera de alcance: ausencias, adelantar/posponer partidas, reparación de ligas con resultados y garantía de óptimo global para cualquier tamaño.
