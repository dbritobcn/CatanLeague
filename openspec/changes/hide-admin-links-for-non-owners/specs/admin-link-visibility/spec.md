# admin-link-visibility delta

## ADDED Requirements

### Requirement: El enlace de administración solo se muestra al propietario
Mientras el visitante navega por las páginas de una liga (`/<code>/clasificacion`, `/<code>/calendario`), la navegación lateral SHALL mostrar el enlace «Administración» únicamente cuando el visitante tenga sesión iniciada y sea el propietario de esa liga. Los visitantes anónimos y los usuarios que no son propietarios NO verán el enlace «Administración» en la navegación.

#### Scenario: Visitante anónimo
- **WHEN** un visitante sin sesión abre `/<code>/clasificacion` de una liga
- **THEN** la navegación lateral muestra «Clasificación» y «Calendario», y no muestra ningún enlace «Administración»

#### Scenario: Usuario autenticado que no es el propietario
- **WHEN** un usuario con sesión iniciada que no es el propietario de la liga abre `/<code>/calendario`
- **THEN** la navegación lateral no muestra el enlace «Administración»

#### Scenario: Propietario de la liga
- **WHEN** el propietario de la liga abre cualquier página de `/<code>/…`
- **THEN** la navegación lateral muestra «Clasificación», «Calendario» y «Administración», sin cambios respecto al comportamiento actual

#### Scenario: Fuera de una liga no cambia nada
- **WHEN** el visitante navega por rutas globales (homepage, `/crear`, `/login`)
- **THEN** la navegación lateral es exactamente la actual, sin consulta de rol ni enlaces de administración

### Requirement: Ningún CTA hacia el panel para visitantes no propietarios
Las páginas públicas de una liga SHALL mostrar botones o llamadas a la acción que enlazan a `/<code>/admin` (o `/<code>/admin#resultados`) únicamente al propietario de la liga. Los visitantes no propietarios NO verán ningún elemento de la interfaz que enlace al panel de administración. En fase de `group_stage` no se SHALL mostrar ningún botón sustituto del CTA «Registrar resultado» a los visitantes no propietarios.

#### Scenario: Clasificación en fase de inscripción
- **WHEN** un visitante que no es el propietario abre `/<code>/clasificacion` de una liga en `registration`
- **THEN** no ve el botón «Añadir participantes» ni ningún otro enlace al panel de administración, y el resto de la página se ve sin huecos rotos

#### Scenario: Clasificación durante la liguilla
- **WHEN** un visitante que no es el propietario abre `/<code>/clasificacion` de una liga en `group_stage` con partidas pendientes
- **THEN** no ve el botón «Registrar resultado» de la cabecera de la clasificación ni ningún botón sustituto

#### Scenario: Banda de próxima jornada
- **WHEN** la banda «Próxima jornada» se renderiza para un visitante que no es el propietario
- **THEN** la banda se muestra con la misma información de mesas y participantes, y su CTA hacia el panel de administración no se renderiza

#### Scenario: El propietario conserva todos los CTAs
- **WHEN** el propietario abre `/<code>/clasificacion` en `registration` o `group_stage`, y la banda de próxima jornada está visible
- **THEN** ve los mismos CTAs hacia el panel de administración que existían antes de este cambio

### Requirement: La decisión de visibilidad se calcula en el servidor
La decisión de si el visitante actual puede administrar la liga SHALL calcularse en el servidor comparando la sesión del usuario con el propietario de la liga, y SHALL ofrecerse a la UI como una única condición (p. ej. `canAdmin`). El tiempo de render de las páginas públicas de una liga para visitantes no propietarios NO SHALL degradarse apreciablemente respecto al actual.

#### Scenario: Fuente única de la condición
- **WHEN** se añade en el futuro un rol adicional de administración (p. ej. admins invitados)
- **THEN** el cambio se concentra en la función servidor que calcula `canAdmin` sin volver a tocar los componentes de UI

#### Scenario: Acceso directo por URL inalterado
- **WHEN** un visitante anónimo o no propietario navega directamente a `/<code>/admin`
- **THEN** recibe exactamente el comportamiento actual: redirect al login si no hay sesión, 404 si no es propietario
