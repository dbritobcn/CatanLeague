# league-management Specification

## Purpose

Gestión del ciclo de vida de las ligas en la plataforma: creación con slug derivado del título, galería pública en la homepage, propiedad, eliminación y persistencia multi-liga.

## Requirements

### Requirement: Creación de liga con slug derivado del título
El sistema SHALL permitir a un usuario autenticado crear una liga proporcionando un título, a partir del cual se genera el código de liga (slug) mediante una tubería determinista: normalizar a minúsculas, quitar diacríticos (`á`→`a`, `ñ`→`n`), sustituir cualquier carácter fuera de `[a-z0-9]` por `-`, colapsar guiones repetidos e iniciales/finales, y validar longitud entre 3 y 60.

#### Scenario: Título con espacios y diacríticos
- **WHEN** el usuario crea una liga titulada `Liga Chólos 2026`
- **THEN** el sistema genera el código `liga-cholos-2026` y redirige al panel de administración de esa liga

#### Scenario: Título que queda vacío tras la limpieza
- **WHEN** el usuario crea una liga cuyo título no deja restos válidos (p. ej. `¡???`)
- **THEN** el sistema rechaza la creación con un error de validación y no crea ninguna liga

#### Scenario: Título demasiado corto o largo
- **WHEN** el slug resultante mide menos de 3 o más de 60 caracteres
- **THEN** el sistema rechaza la creación con un error de validación

### Requirement: Slug reservado
El sistema SHALL rechazar la creación de ligas cuyo slug coincida con una ruta reservada de primer nivel (`crear`, `login`, `logout`, `invitar`, `admin`, `api`, `auth`, entre otras definidas en una única lista).

#### Scenario: Título colisiona con ruta reservada
- **WHEN** el usuario crea una liga titulada `Crear`
- **THEN** el sistema rechaza la creación con un error de validación que indica que el nombre no está disponible

### Requirement: Unicidad del slug con rechazo explícito
El sistema SHALL garantizar que el slug sea único en la base de datos. En caso de colisión, SHALL rechazar la creación con un mensaje claro ("ese nombre ya está cogido") en lugar de generar un sufijo automático.

#### Scenario: Dos ligas con el mismo título
- **WHEN** ya existe una liga con código `liga-cholos` y otro usuario crea una liga titulada `Liga Cholos`
- **THEN** el sistema rechaza la segunda creación con un error y la liga original permanece accesible en su URL

### Requirement: Slug inmutable
El sistema SHALL tratar el código de liga como inmutable tras la creación; ninguna operación posterior podrá cambiarlo.

#### Scenario: La liga evoluciona
- **WHEN** la liga avanza de estado (registro → liguilla → final → terminada)
- **THEN** su URL `/<code>/…` permanece exactamente la misma

### Requirement: Galería pública de ligas en la homepage
La homepage SHALL mostrar públicamente todas las ligas creadas, ordenadas de más reciente a más antigua, sin requerir sesión. Cada tarjeta SHALL mostrar el nombre, el estado, el progreso (partidas jugadas/totales) y el líder actual o el campeón si la liga ha terminado, con enlace a su clasificación.

#### Scenario: Visitante sin sesión ve las ligas
- **WHEN** un visitante anónimo abre la homepage y existen ligas creadas
- **THEN** ve el listado con nombre, estado, progreso y líder/campeón de cada liga, y puede pulsar cualquier tarjeta para ir a `/<code>/clasificacion`

#### Scenario: Liga terminada en la galería
- **WHEN** una liga del listado está en estado `finished`
- **THEN** su tarjeta muestra el campeón en lugar del líder actual

#### Scenario: Aún no hay ligas
- **WHEN** un visitante abre la homepage y no existe ninguna liga
- **THEN** ve la llamada a crear la primera liga, sin errores ni listado vacío visible

#### Scenario: Botón crear liga
- **WHEN** un visitante pulsa "Crear liga" en la homepage
- **THEN** es redirigido a la página `/crear`

### Requirement: Página de creación aparte
El sistema SHALL ofrecer la creación de ligas en una página dedicada (`/crear`) que requiere sesión iniciada. El formulario SHALL pedir únicamente el título y MAY mostrar una previsualización en vivo del slug resultante. La validación autoritativa SHALL ejecutarse siempre en el servidor.

#### Scenario: Usuario sin sesión intenta crear
- **WHEN** un visitante sin sesión navega a `/crear`
- **THEN** es redirigido al login y, tras autenticarse, vuelve al formulario de creación

#### Scenario: Preview del slug mientras se escribe
- **WHEN** el usuario escribe `Liga Viernes!` en el formulario
- **THEN** la previsualización muestra `liga-viernes` en tiempo real

### Requirement: Propiedad de la liga
El sistema SHALL registrar como propietario (`owner_id`) al usuario autenticado que crea la liga, y asociar la liga de forma exclusiva a su cuenta.

#### Scenario: El creador queda como owner
- **WHEN** el usuario U crea la liga `liga-cholos`
- **THEN** `liga-cholos.queda` registrada con `owner_id` de U y solo U figura como propietario

### Requirement: Eliminación de liga por el propietario
El sistema SHALL permitir al propietario eliminar su liga desde el panel de administración, con una confirmación explícita e inequívoca. La eliminación SHALL liberar el slug para futuras creaciones.

#### Scenario: Owner elimina su liga
- **WHEN** el propietario pulsa "Eliminar liga" y confirma el diálogo irreversible
- **THEN** la liga desaparece de la galería, su URL deja de resolver y el slug queda libre para una nueva liga

#### Scenario: Slug liberado y reutilizado
- **WHEN** tras eliminar `liga-cholos`, otro usuario crea una liga titulada `Liga Cholos`
- **THEN** la creación tiene éxito y la nueva liga reside en la misma URL base

### Requirement: Persistencia multi-liga
El sistema SHALL persistir cada liga como una entidad identificada por su código, con el agregado completo serializado, en Supabase (tabla `leagues` con columna `jsonb` y políticas RLS de lectura pública y escritura exclusiva del propietario). El repositorio local por archivos SHALL permanecer disponible para desarrollo y tests mediante configuración de entorno, con la misma interfaz.

#### Scenario: Reinicio del proceso o nuevo deploy
- **WHEN** la liga se guarda en Supabase y la app se despliega de nuevo
- **THEN** la liga se recupera íntegra (estado, participantes, resultados) desde la base de datos

#### Scenario: RLS bloquea escritura ajena
- **WHEN** se intenta modificar o eliminar una fila de `leagues` con la sesión de un usuario que no es su propietario, por cualquier vía que no pase por los gates de la app
- **THEN** Postgres rechaza la operación por política RLS
