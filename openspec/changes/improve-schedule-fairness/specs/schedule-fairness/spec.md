## ADDED Requirements

### Requirement: La mejora de equidad conserva las reglas del calendario

Para ligas de 5 a 24 participantes, el generador SHALL producir partidas de cuatro jugadores inscritos distintos, sin repetir mesas, con todas las parejas enfrentándose al menos una vez, igual número de partidas por jugador y sin que ningún jugador participe en dos partidas de la misma jornada. La fase de mejora de equidad SHALL conservar el número de partidas y las participaciones de cada jugador del calendario base producido por las fases de cobertura y equilibrado, antes de asignar jornadas. La asignación de jornadas SHALL ejecutarse sobre las mesas definitivas.

#### Scenario: Calendario válido para todos los tamaños admitidos
- **WHEN** se genera un calendario para cualquiera de los tamaños de liga entre 5 y 24 participantes distintos
- **THEN** todas las mesas contienen cuatro jugadores inscritos distintos, ninguna mesa se repite y todas las parejas están cubiertas
- **AND** todos los participantes juegan el mismo número de partidas y nadie aparece dos veces en una misma jornada

#### Scenario: Una mejora no alarga la liguilla añadiendo partidas
- **WHEN** la fase de mejora transforma el calendario base
- **THEN** mantiene el número total de partidas y el número de participaciones de cada jugador, aunque las mesas y el reparto en jornadas puedan cambiar

### Requirement: Calendario equilibrado de diez participantes

Para cualquier lista ordenada de 10 participantes distintos, el generador SHALL producir exactamente 10 partidas y cuatro participaciones por jugador. Cada una de las 45 parejas SHALL coincidir en una o dos partidas: exactamente 30 parejas una vez y 15 parejas dos veces. Por tanto, ninguna pareja SHALL compartir todas las partidas de ambos jugadores. Esta garantía SHALL cumplirse sin depender de un resultado aleatorio de la búsqueda.

#### Scenario: Regresión de Theresa y David
- **WHEN** se genera una liga con Iria, Adri, Carmen, Lucas, Xavi, Ingrid, Isis, Alberto, David y Theresa
- **THEN** hay 10 partidas y cada participante aparece en cuatro
- **AND** David y Theresa coinciden en una o dos partidas, y cada uno tiene al menos dos partidas sin el otro
- **AND** todas las demás parejas también coinciden entre una y dos veces

#### Scenario: El barajado no cambia la garantía
- **WHEN** la misma plantilla de 10 participantes se entrega en otro orden, o sus identificadores se sustituyen por otros identificadores distintos
- **THEN** el calendario conserva las 10 partidas, las cuatro participaciones por jugador y la distribución de 30 parejas con un encuentro y 15 parejas con dos

### Requirement: La calidad no empeora respecto al calendario base

La calidad de un calendario SHALL medirse mediante la tupla `(C, M, S)`, donde `C` es el número de parejas acopladas, `M` es el máximo de encuentros de una pareja y `S` es la suma de los cuadrados de los encuentros de cada pareja no ordenada. Una pareja SHALL considerarse acoplada cuando comparte todas las partidas de ambos jugadores y tiene al menos un encuentro. Se SHALL comparar las tuplas en orden lexicográfico ascendente, priorizando `C`, después `M` y después `S`. El calendario mejorado SHALL tener una tupla menor o igual que la del calendario base; esto no exige que todos los componentes disminuyan individualmente.

#### Scenario: Se encuentra una distribución mejor
- **WHEN** existe una transformación válida explorada que reduce las parejas acopladas, o mantiene ese número y mejora los siguientes componentes de la tupla
- **THEN** la fase de mejora conserva la mejor tupla encontrada en lugar de devolver una peor

#### Scenario: No se encuentra una mejora
- **WHEN** al finalizar la fase de mejora, incluida la garantía específica para 10 participantes cuando corresponda, no se dispone de una distribución válida con una tupla menor
- **THEN** devuelve el calendario base o uno con la misma tupla, sin añadir partidas ni perder cobertura

#### Scenario: Acoplamiento inevitable con seis participantes
- **WHEN** el generador produce las tres partidas de cuatro jugadores del calendario base para seis participantes, con dos participaciones por jugador
- **THEN** acepta las parejas acopladas inevitables sin rechazar el inicio de la liga ni añadir partidas para eliminarlas
- **AND** mantiene la regla de no empeorar la tupla de calidad

### Requirement: Generación determinista y búsqueda acotada

Para la misma lista ordenada de identificadores, el generador SHALL devolver el mismo calendario, incluyendo las jornadas. La fase de mejora SHALL usar un presupuesto finito y explícito de operaciones, independiente del reloj, y SHALL devolver un calendario válido con calidad no inferior a la base al agotarlo. Agotar el presupuesto SHALL NOT debilitar la garantía específica para 10 participantes. No se SHALL prometer optimalidad global ni ausencia de acoplamientos para todos los demás tamaños de liga.

#### Scenario: Repetición con la misma entrada
- **WHEN** se genera varias veces el calendario con la misma lista ordenada de jugadores
- **THEN** se obtienen las mismas mesas en el mismo orden y con las mismas jornadas

#### Scenario: Presupuesto de búsqueda agotado
- **WHEN** la fase de mejora alcanza su límite de exploración
- **THEN** termina devolviendo el mejor calendario válido conservado y nunca uno peor que el base
- **AND** si hay 10 participantes, el resultado sigue cumpliendo el máximo de dos encuentros por pareja

### Requirement: Los calendarios persistidos no se regeneran automáticamente

El despliegue de la mejora SHALL afectar únicamente a nuevas generaciones de calendario. Leer o guardar una liga ya iniciada SHALL NOT alterar sus mesas, jornadas, identificadores ni resultados. El propietario SHALL poder obtener un calendario nuevo mediante el flujo existente de reiniciar e iniciar liga; este cambio SHALL NOT añadir una acción de reparación de calendarios con resultados.

#### Scenario: Consulta de una liga ya iniciada
- **WHEN** se carga o consulta una liga iniciada antes del despliegue
- **THEN** su calendario y sus resultados permanecen intactos aunque contengan parejas acopladas

#### Scenario: Regeneración voluntaria sin resultados
- **WHEN** el propietario reinicia una liga de 10 participantes sin resultados y vuelve a iniciarla tras el despliegue
- **THEN** se conservan los participantes y se genera un calendario que cumple la nueva garantía para 10 jugadores
