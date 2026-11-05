## ADDED Requirements

### Requirement: La vista de clasificación exhibe la jornada en curso
Mientras una liga esté en `group_stage` y exista al menos una partida pendiente de la liguilla, la página `/<code>/clasificacion` SHALL mostrar una banda destacada "Próxima jornada" colocada entre el hero de la liga y la tabla de clasificación. La banda SHALL identificar la jornada en curso y listar únicamente las mesas pendiente de esa jornada con sus participantes.

#### Scenario: Jornada completa pendiente
- **WHEN** el visitante abre `/<code>/clasificacion` de una liga en la que la jornada 2 es la primera jornada con partidas pendientes y esa jornada tiene 2 mesas
- **THEN** ve la banda "Próxima jornada · Jornada 2" con 2 mesas etiquetadas "Mesa A" y "Mesa B", cada una con los nombres de sus 4 jugadores en el mismo orden en que aparecen en el calendario

#### Scenario: Jornada parcialmente jugada
- **WHEN** de la primera jornada incompleta, la mesa 1 ya tiene resultado registrado y la mesa 2 está pendiente
- **THEN** la banda muestra solo la mesa pendiente ("Mesa A") sin mencionar a la mesa ya jugada

#### Scenario: Resultados registrados fuera de orden
- **WHEN** el administrador ha registrado una partida de la jornada 4 pero la jornada 3 todavía tiene mesas pendientes
- **THEN** la banda identifica la jornada 3 como la próxima jornada, no la jornada 4

### Requirement: La jornada en curso es la primera ronda con partidas pendientes
El read-model de calendario (`ScheduleView` devuelto por `GetSchedule`) SHALL exponer un campo `currentRound` que, cuando exista al menos una partida pendiente de la liguilla, contenga el número de la primera ronda (ordenada por número de ronda) con al menos una partida pendiente y la lista **solo de esas partidas pendientes**, ordenadas por número de partida. Si no hay partidas pendientes, `currentRound` SHALL ser `null`.

#### Scenario: Primera ronda incompleta
- **WHEN** `GetSchedule` se ejecuta sobre una liga en la que la ronda 1 está completa, la ronda 2 tiene la partida 5 jugada y la partida 6 pendiente, y la ronda 3 está sin jugar
- **THEN** `currentRound` es `{ round: 2, matches: [partida 6] }`

#### Scenario: Liga en fase de final
- **WHEN** `GetSchedule` se ejecuta sobre una liga con todos los partidos de grupo jugados y status `final`
- **THEN** `currentRound` es `null`

#### Scenario: Liga en inscripción
- **WHEN** `GetSchedule` se ejecuta sobre una liga en status `registration`
- **THEN** `currentRound` es `null`

### Requirement: Etiquetas de mesa derivadas y nombres de los jugadores
La banda SHALL etiquetar las mesas pendientes de la jornada en curso como "Mesa A", "Mesa B", "Mesa C", … en el orden ascendente de número de partida dentro de la jornada. Cada mesa SHALL listar los nombres de sus cuatro jugadores; los jugadores SHALL exhibirse como elementos independientes (p. ej. chips o líneas) para que el texto pueda saltar de línea en pantallas estrechas sin perder legibilidad.

#### Scenario: Varias mesas en la misma jornada
- **WHEN** la jornada en curso tiene 3 mesas pendientes con números de partida 7, 8 y 9
- **THEN** la banda las exhibe como "Mesa A" (partida 7), "Mesa B" (partida 8) y "Mesa C" (partida 9) con sus 4 nombres respectivamente

#### Scenario: Vista estrecha con nombres largos
- **WHEN** la banda se renderiza en un viewport de móvil con jugadores de nombre largo
- **THEN** los nombres se envuelven en filas nuevas sin desbordamiento horizontal de la página ni solapamiento de texto

### Requirement: La banda es informativa y no se muestra cuando no aplica
La banda SHALL ser informativa: no contendrá formularios ni acciones de registro; enlaza a `/<code>/calendario` para el detalle completo. La banda SHALL NO renderizarse en ninguna de estas situaciones, y el resto de la página de clasificación se verá exactamente igual que hoy: liga en `registration`, liga en `final` (cubierta por la sección "La gran final"), o liga en `finished`.

#### Scenario: Liga finalizada
- **WHEN** el visitante abre `/<code>/clasificacion` de una liga en `finished`
- **THEN** no ve ninguna banda "Próxima jornada" y sí ve la sección de campeón tal y como existe hoy

#### Scenario: CTA de registro conservado
- **WHEN** la banda está visible en una liga en `group_stage`
- **THEN** el botón "Registrar resultado" del cabecera de la tabla de clasificación sigue apareciendo en su posición actual y enlazando al panel de administración

#### Scenario: Enlace al calendario
- **WHEN** el visitante abre `/<code>/clasificacion` de una liga en `group_stage`
- **THEN** la banda contiene un enlace a `/<code>/calendario` con una etiqueta coherente (p. ej. "Ver calendario")
