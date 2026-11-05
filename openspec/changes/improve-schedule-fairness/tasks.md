## 1. Caracterizar el generador y fijar las regresiones

- [x] 1.1 Capturar antes de modificar el generador los recuentos de partidas, participaciones y tuplas `(C, M, S)` para 5–24 jugadores como datos de regresión; registrar también una medida orientativa del coste con 24 jugadores.
- [x] 1.2 Añadir helpers de test que calculen independientemente desde los fixtures la cobertura, mesas únicas, participaciones, encuentros por pareja, acoplamientos y tupla lexicográfica.
- [x] 1.3 Añadir el test de regresión de los 10 participantes de referencia: 10 mesas, cuatro partidas por jugador, 45 parejas cubiertas, máximo dos encuentros y distribución exacta 30/15; comprobar que falla con el generador actual.

## 2. Implementar la mejora de equidad en el dominio

- [x] 2.1 Crear el auxiliar puro de mejora de mesas en `src/domain/services/`, con copias de entrada, métricas `(C, M, S)` y comparación lexicográfica; probar el cálculo y la prioridad de cada componente.
- [x] 2.2 Implementar intercambios deterministas de jugadores entre dos mesas preservando participaciones; mantener contadores de encuentros y claves canónicas para rechazar jugadores duplicados, mesas repetidas y pérdida de cobertura.
- [x] 2.3 Incorporar aceptación de mejoras estrictas y presupuesto inicial de 50.000 candidatos y 32 barridos, contabilizando también descartes; probar agotamiento con presupuesto reducido, ausencia de mejora, terminación e inmutabilidad de entrada.
- [x] 2.4 Incorporar la construcción verificada para 10 jugadores como alternativa cuando la búsqueda no cumpla el máximo de dos encuentros; mapear índices a IDs de entrada y comprobar sus propiedades también con presupuesto de búsqueda cero.
- [x] 2.5 Integrar el auxiliar entre `balanceGamesPerPlayer` y `assignRounds`; asignar jornadas a las mesas definitivas y actualizar la documentación interna de la tubería, sin cambiar el puerto `ScheduleGenerator`, el agregado ni los casos de uso.

## 3. Verificar garantías y compatibilidad

- [x] 3.1 Extender los tests para 5–24 jugadores verificando validez completa, conservación de partidas y participaciones respecto a la base, y tupla no peor; incluir permutaciones de entrada reproducibles.
- [x] 3.2 Verificar la garantía de 10 jugadores con distintos órdenes e identificadores, comprobando propiedades y no una única ordenación de mesas; asegurar que nadie juega dos veces en una jornada tras la mejora.
- [x] 3.3 Añadir regresión de seis jugadores que conserve tres mesas y dos participaciones por persona, aceptando el acoplamiento inevitable sin incrementar partidas ni lanzar error.
- [x] 3.4 Añadir tests de determinismo para entradas ordenadas idénticas y de no regresión de un calendario ya óptimo, como el de 16 jugadores con un encuentro por pareja.
- [x] 3.5 Añadir integración de inicio y reinicio con el generador real, `Shuffler` fijo y repositorio en memoria; comprobar la nueva garantía para 10 jugadores y que cargar/guardar un calendario anterior con resultados no lo modifica.

## 4. Documentar y validar la entrega

- [x] 4.1 Actualizar `README.md` con las garantías de equidad, los límites para otros tamaños y el flujo voluntario de reiniciar/iniciar para ligas sin resultados, advirtiendo que reiniciar descarta resultados existentes.
- [x] 4.2 Medir la sobrecarga con 24 jugadores y verificar el límite de operaciones; ajustar las constantes solo si es necesario, conservando determinismo y documentando las medidas sin introducir assertions de tiempos de pared.
- [x] 4.3 Ejecutar `npm test` y `npm run typecheck`, resolver regresiones y validar el cambio con `openspec validate improve-schedule-fairness --strict`; comprobar que no se han modificado calendarios persistidos ni añadido cambios de UI, permisos o base de datos.
