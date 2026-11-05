## ADDED Requirements

### Requirement: Inicio de sesión con email y contraseña
El sistema SHALL permitir a un visitante autenticarse con email y contraseña a través de Supabase Auth, manteniendo la sesión en cookies httpOnly accesibles desde el servidor (server components y server actions).

#### Scenario: Credenciales correctas
- **WHEN** un visitante introduce un email y contraseña registrados en `/login` (pestaña "Entrar")
- **THEN** el sistema fija la sesión en cookies httpOnly y lo redirige al destino (`next`) o a la homepage

#### Scenario: Credenciales incorrectas
- **WHEN** el email no existe o la contraseña no coincide
- **THEN** el sistema muestra "Email o contraseña incorrectos" y no se crea sesión

### Requirement: Creación de cuenta
El sistema SHALL permitir crear una cuenta nueva desde `/login` (pestaña "Crear cuenta") con email y contraseña de al menos 6 caracteres. Con la confirmación por email desactivada en el proyecto, el registro SHALL iniciar sesión automáticamente; si estuviera activada, el sistema SHALL indicar al usuario que revise su bandeja de entrada.

#### Scenario: Registro con email nuevo
- **WHEN** un visitante crea una cuenta con un email no registrado y contraseña válida
- **THEN** la cuenta se crea, la sesión se establece y es redirigido al destino

#### Scenario: Email ya registrado
- **WHEN** se intenta crear una cuenta con un email que ya existe
- **THEN** el sistema muestra "Ya existe una cuenta con ese email" y no se crea sesión

#### Scenario: Contraseña demasiado corta
- **WHEN** la contraseña tiene menos de 6 caracteres
- **THEN** el sistema rechaza el envío con un mensaje claro y no se crea la cuenta

### Requirement: Cierre de sesión
El sistema SHALL permitir al usuario autenticado cerrar sesión desde cualquier página que lo requiera.

#### Scenario: Owner cierra sesión
- **WHEN** el usuario autenticado pulsa "Cerrar sesión" en el panel de administración
- **THEN** las cookies de sesión se invalidan y el usuario es redirigido a la homepage

### Requirement: Refresco de sesión
El sistema SHALL refrescar la sesión vía proxy (antes middleware) en cada request para que server components y server actions siempre lean una sesión válida y no caducada.

#### Scenario: Token caducado durante navegación
- **WHEN** un usuario con la sesión a punto de caducar navega por la app
- **THEN** el proxy refresca el token en cookies antes de que las páginas lo lean

### Requirement: El dominio desconoce la autenticación
La capa de dominio y los casos de uso SHALL permanecer libres de cualquier referencia a cuentas, usuarios o sesiones; la identidad del usuario solo interviene en la capa de presentación (gates) y al fijar `owner_id` al crear la liga.

#### Scenario: Un caso de uso existente se ejecuta con sesión iniciada
- **WHEN** se ejecuta por ejemplo `AddPlayer` para una liga
- **THEN** el caso de uso recibe únicamente el código de liga y sus parámetros de negocio, sin información de sesión o usuario
