# league-scoped-routes Specification

## Purpose

Rutas por liga bajo `/[code]/…`: vistas públicas de lectura, panel de administración con propiedad exclusiva, protección de las server actions mutantes, aislamiento entre ligas y redirección de las rutas legadas.

## Requirements

### Requirement: Rutas públicas de lectura por liga
El sistema SHALL servir las vistas de clasificación y calendario de cada liga bajo `/<code>/clasificacion` y `/<code>/calendario`, accesibles públicamente sin sesión para cualquier visitante que conozca la URL.

#### Scenario: Visitante anónimo consulta una liga
- **WHEN** un visitante sin sesión abre `/<code>/clasificacion` de una liga existente
- **THEN** ve la clasificación de esa liga con los mismos datos que cualquier administrador vería

#### Scenario: Código de liga inexistente
- **WHEN** un visitante abre `/<code>/clasificacion` y no existe ninguna liga con ese código
- **THEN** el sistema responde con una página 404 que no revela si el código existió en algún momento

### Requirement: Panel de administración por liga con propiedad exclusiva
El sistema SHALL servir el panel de administración de cada liga bajo `/<code>/admin`, accesible únicamente al propietario de la liga. Un visitante sin sesión SHALL ser redirigido al login; un usuario autenticado que no es el propietario SHALL recibirse una denegación.

#### Scenario: Owner accede a su panel
- **WHEN** el propietario de `liga-cholos` navega a `/liga-cholos/admin`
- **THEN** ve el panel completo (participantes, inicio/reinicio, resultados) tal y como existe hoy

#### Scenario: Anónimo intenta acceder al panel
- **WHEN** un visitante sin sesión navega a `/<code>/admin`
- **THEN** es redirigido al login

#### Scenario: Autenticado no propietario intenta acceder
- **WHEN** un usuario autenticado que no es el propietario navega a `/<code>/admin`
- **THEN** el sistema le deniega el acceso sin revelar detalles de la liga

### Requirement: Server actions mutantes protegidas
Todas las server actions de mutación (`añadir participante`, `eliminar participante`, `iniciar liga`, `reiniciar liga`, `registrar resultado` y `eliminar liga`) SHALL verificar sesión y propiedad de la liga correspondiente ANTES de ejecutar cualquier caso de uso, con independencia de la página desde la que se invoquen. La verificación en la página es defense in depth; la frontera real es la action.

#### Scenario: POST directo a una action sin sesión
- **WHEN** un cliente envía una petición POST directamente a una action mutante sin cookie de sesión
- **THEN** la action no ejecuta el caso de uso y responde con un error o redirección al login

#### Scenario: POST directo a una action de liga ajena
- **WHEN** un usuario autenticado envía un POST directo a una action mutante de una liga de la que no es propietario
- **THEN** la action no ejecuta el caso de uso y la liga permanece intacta

#### Scenario: El owner muta su liga
- **WHEN** el propietario envía un formulario válido desde `/<code>/admin`
- **THEN** la action ejecuta el caso de uso sobre esa liga concreta y solo sobre ella

### Requirement: Aislamiento entre ligas
Las operaciones sobre una liga SHALL afectar exclusivamente a la liga identificada por el código de su ruta; ninguna acción puede leer o escribir el estado de otra liga.

#### Scenario: Registrar un resultado
- **WHEN** el propietario registra el resultado de una partida de `liga-cholos`
- **THEN** ninguna otra liga de la plataforma cambia de estado, participantes ni resultados

### Requirement: Redirección de rutas raíz legadas
Las rutas actuales de primer nivel (`/clasificacion`, `/calendario`, `/admin`) SHALL redirigir permanentemente a la homepage, dado que ya no representan una liga concreta.

#### Scenario: Enlace antiguo compartido
- **WHEN** alguien abre `/clasificacion` tras el despliegue del cambio
- **THEN** es redirigido a la homepage
