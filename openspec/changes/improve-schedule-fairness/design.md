## Context

`BalancedCoveringScheduleGenerator.generate()` construye mesas mediante cobertura voraz de parejas, equilibra participaciones y ejecuta `assignRounds()`. El primer criterio solo exige al menos un encuentro entre cada pareja. El equilibrado puede concentrar los encuentros adicionales en las mismas parejas, aunque todos jueguen igual número de partidas.

`StartLeague` baraja los identificadores antes de llamar al generador. El generador es determinista para una entrada ordenada; cambiar los nombres de los jugadores mediante un barajado no elimina un defecto estructural de la distribución. `League.start()` valida la cobertura y las mesas, y asigna identificadores y números después de recibir los fixtures. Las jornadas son números de las partidas, no entidades con fechas.

La observación inicial identifica un caso concreto de 10 participantes con una pareja presente en sus cuatro partidas. La exploración ha verificado una construcción alternativa de 10 mesas, cuatro participaciones por persona y máximo de dos encuentros por pareja. Las muestras exploratorias no constituyen una prueba de calidad para todos los tamaños.

## Goals / Non-Goals

**Goals:**

- Resolver de forma garantizada el caso de 10 participantes sin añadir partidas.
- Mejorar la distribución general de encuentros mediante trabajo determinista y acotado, conservando el calendario base si no se encuentra nada mejor.
- Preservar validez, participaciones individuales, interfaz del generador y arquitectura de dominio sin dependencias externas.
- Expresar límites verificables en lugar de prometer un óptimo universal.

**Non-Goals:**

- Modelar ausencias o disponibilidad, adelantar/posponer partidas o introducir controles en el calendario.
- Recalcular ligas iniciadas, modificar resultados, añadir roles o cambiar almacenamiento.
- Minimizar el número de jornadas o mantener las mismas jornadas del algoritmo anterior.
- Garantizar ausencia de acoplamientos para todos los tamaños o resolver exactamente el problema combinatorio general.

## Decisions

### 1. Añadir una fase independiente antes de asignar jornadas

La tubería será:

```text
cobertura → equilibrado → mejora de mesas → asignación de jornadas → Fixture[]
                             │
                             └─ optimización acotada + garantía para n=10
```

Extraer la mejora a un auxiliar puro dentro de `src/domain/services/`, operando sobre índices de jugadores y copias de las mesas. El auxiliar recibe las mesas base y devuelve las definitivas; no muta la entrada ni reutiliza contadores obsoletos de `Plan`. El puerto `ScheduleGenerator`, `League`, los casos de uso y la composición de dependencias no cambian.

Se descarta cambiar `assignRounds()` como solución: reordenar jornadas no cambia qué jugadores comparten todas sus partidas. También se descarta regenerar al leer ligas: alteraría compromisos y resultados persistidos.

### 2. Definir explícitamente qué significa «más justo»

Para cada pareja no ordenada se calcula su número de encuentros `m(a,b)`. Se evalúa la tupla lexicográfica ascendente:

1. `C`: parejas con `m(a,b) > 0` y `m(a,b) = games(a) = games(b)`.
2. `M`: máximo de `m(a,b)`.
3. `S`: suma de `m(a,b)²` para todas las parejas no ordenadas.

Se prioriza eliminar dependencias completas entre dos jugadores, después reducir el peor caso y finalmente distribuir las repeticiones. No se afirma que cada componente sea individualmente no creciente: una mejora del primero tiene prioridad sobre los siguientes. Para 10 participantes, la garantía específica de máximo dos encuentros se aplica además de esta comparación.

Con número de partidas fijo, el total de encuentros entre parejas es fijo (`6 × partidas`). Por tanto, reducir el total de repeticiones no es un objetivo útil: importa su distribución. La suma de cuadrados penaliza la concentración. El mínimo teórico del máximo es una cota, no una prueba de que exista un calendario que lo alcance para cualquier tamaño.

Se descarta un límite universal de dos encuentros: es imposible para algunos tamaños. Se descarta usar solo cobertura o participaciones como medida de calidad: son precisamente las reglas que el calendario defectuoso ya cumple.

### 3. Búsqueda local de intercambios válidos, con límite de trabajo

Explorar pares de mesas y posiciones de forma estable. Intercambiar un jugador de cada mesa preserva automáticamente las participaciones individuales y el número total de partidas. Cada candidato se acepta únicamente si:

- Las dos mesas siguen teniendo cuatro jugadores distintos.
- No se repite ninguna mesa del calendario, usando claves canónicas que ordenen los índices sin mutar las mesas.
- Ninguna pareja pierde su último encuentro.
- La tupla de calidad mejora estrictamente respecto al mejor calendario conservado.

Mantener contadores de encuentros y claves de mesa; calcular los cambios de las dos mesas afectadas en lugar de reconstruir el calendario completo para cada candidato. Toda exploración conserva la base como alternativa válida.

Usar inicialmente un máximo interno de 50.000 candidatos examinados y 32 barridos, deteniéndose en el primer límite o tras un barrido sin mejora. Contar también los candidatos descartados para que el límite sea real. Los valores serán constantes con nombre, no límites temporales; cualquier ajuste durante implementación debe conservar tests del agotamiento del presupuesto. No usar `Math.random()`, reloj, búsqueda sin fin ni nuevos paquetes de optimización. Permitir un presupuesto reducido en tests del auxiliar, sin cambiar el puerto público.

Se descartan búsquedas exhaustivas generales y reintentos aleatorios hasta acertar por su coste impredecible. No se añaden movimientos de meseta ni reinicios de búsqueda en esta primera versión; los óptimos locales se resuelven para el caso obligatorio mediante la construcción del apartado siguiente.

### 4. Garantía constructiva para 10 participantes

Una heurística con límite no demuestra que siempre encuentre el óptimo. Si la mejora general no entrega 10 mesas con cuatro participaciones por jugador y máximo dos encuentros por pareja, usar una construcción verificada sobre los índices de entrada `0..9`, mapeándola a los identificadores recibidos. La siguiente construcción es un testigo válido:

| Mesa | Índices de jugadores |
|---|---|
| 1 | 3, 5, 6, 7 |
| 2 | 1, 4, 7, 8 |
| 3 | 0, 2, 4, 7 |
| 4 | 2, 3, 6, 8 |
| 5 | 0, 1, 2, 3 |
| 6 | 1, 6, 7, 9 |
| 7 | 0, 5, 8, 9 |
| 8 | 0, 4, 5, 6 |
| 9 | 1, 2, 5, 9 |
| 10 | 3, 4, 8, 9 |

Se han comprobado sus 10 mesas únicas, las cuatro participaciones por índice y los 45 pares cubiertos, con distribución de 30 pares una vez y 15 dos veces. Las pruebas deben verificar independientemente estas propiedades, no limitarse a comparar contra la tabla. El barajado existente de `StartLeague` aporta variedad al mapear personas a índices; los nombres no reciben trato especial.

Diez mesas contienen 60 encuentros de pareja distribuidos entre 45 parejas. La cobertura impide un máximo menor que dos; con máximo dos, la distribución 30/15 se deduce necesariamente. Esta construcción alcanza esa cota y su tupla es `(0, 2, 90)`.

La alternativa es confiar solo en una heurística que haya funcionado en muestras. Se descarta porque no garantiza ni el caso de regresión ni el comportamiento al agotar el presupuesto. La construcción no generaliza requisitos para otros tamaños y no añade partidas al calendario base de 10 jugadores.

### 5. Acoplamientos inevitables y compatibilidad

Para seis jugadores, tres partidas y dos participaciones por persona, cada jugador descansa exactamente una partida. Las seis ausencias se agrupan en tres pares; los dos jugadores que descansan juntos comparten sus otras dos partidas. Eliminar estos acoplamientos manteniendo esas cantidades es imposible. El optimizador debe aceptar este resultado válido, sin errores ni más partidas.

Para otros tamaños, se devuelve la mejor distribución encontrada bajo el presupuesto sin afirmar optimalidad ni certificar imposibilidad. La validación de equidad pertenece al servicio y sus tests; `League.assertValidGroupStage` mantiene su contrato de validez y continúa aceptando calendarios anteriores.

### 6. Verificación independiente y casos de uso

- Ampliar los tests actuales del generador para 5–24 participantes con métricas calculadas desde los fixtures finales, no desde contadores internos.
- Fijar como datos de regresión los recuentos de partidas, participaciones y tuplas de la versión base antes de modificar el generador; no mantener una segunda implementación productiva del algoritmo antiguo.
- Comprobar invariantes y no regresión frente a esas bases, y usar una colección pequeña y reproducible de permutaciones de entrada.
- Para 10 participantes, comprobar distribución 30/15, ausencia de acoplamientos, renombrado de IDs, determinismo y funcionamiento con presupuesto de búsqueda cero para cubrir la alternativa constructiva.
- Probar en el auxiliar el rechazo de duplicados, pérdida de cobertura y mesas repetidas, así como presupuesto agotado, ausencia de mejora y entrada inmutable.
- Probar el inicio y reinicio con el generador real y un `Shuffler` fijo usando el repositorio en memoria. Comprobar también que cargar una liga anterior, incluso con resultados, no altera su snapshot.
- Medir por separado la sobrecarga con 24 jugadores; no convertir tiempos de pared variables en assertions de corrección ni confundir el límite del optimizador con el coste de todo el generador.

## Risks / Trade-offs

- [Óptimos locales fuera del caso de 10 jugadores] → Garantizar solo no regresión; documentar que la ausencia de mejora no demuestra imposibilidad matemática.
- [Coste adicional al iniciar una liga] → Presupuesto de operaciones, evaluación incremental y medición con el tamaño máximo antes de cerrar las tareas.
- [Más jornadas pese a conservar partidas] → Recalcular jornadas válidas después de los swaps; minimizar jornadas queda explícitamente fuera del alcance.
- [Construcción específica difícil de mantener] → Aislarla, documentar su justificación y comprobar propiedades independientemente con permutaciones y nuevos identificadores.
- [Una menor dependencia no resuelve todas las ausencias] → No prometer que siempre exista una partida disponible en una jornada concreta; disponibilidad y reordenación siguen siendo otro cambio.
- [El equilibrado actual tiene salida de mejor esfuerzo] → Mantener la comprobación de igualdad para todo el rango 5–24; el optimizador preserva participaciones y no puede reparar un fallo previo de equilibrado. Una regresión ahí bloquea la entrega.
- [Reiniciar puede borrar resultados futuros] → No automatizarlo ni ejecutarlo durante esta propuesta; explicar que la regeneración recomendada es para ligas sin resultados y que el reinicio existente descarta resultados.

## Migration Plan

1. Implementar el servicio y superar los tests antes de desplegar; no hay migraciones ni cambios en el formato de snapshots.
2. Desplegar: solo los calendarios generados a partir de entonces cambian.
3. Para la liga de referencia, el propietario comprueba que sigue sin resultados y usa «Reiniciar liga» y después «Iniciar liga». Conserva participantes y recibe el calendario justo. No se ejecuta esta acción como parte del desarrollo.
4. Rollback: revertir el cambio de código restaura el generador anterior para futuras generaciones; los calendarios ya guardados siguen siendo válidos y no se alteran automáticamente.

## Open Questions

Ninguna decisión funcional pendiente. El presupuesto inicial de búsqueda se revisará con medidas de rendimiento, manteniendo el límite explícito y la garantía constructiva para 10 jugadores.
