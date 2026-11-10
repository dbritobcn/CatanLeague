# next-round-band delta

## MODIFIED Requirements

### Requirement: La banda es informativa y no se muestra cuando no aplica
La banda SHALL ser informativa: no contendrá formularios ni acciones de registro; enlaza a `/<code>/calendario` para el detalle completo. Su llamada a la acción hacia el panel de administración (p. ej. «Registrar resultado», enlazando a `/<code>/admin#resultados`) SHALL mostrarse únicamente al propietario de la liga; los visitantes anónimos y los usuarios que no son propietarios verán la banda sin esa llamada a la acción. La banda SHALL NO renderizarse en ninguna de estas situaciones, y el resto de la página de clasificación se verá exactamente igual que hoy: liga en `registration`, liga en `final` (cubierta por la sección "La gran final"), o liga en `finished`.

#### Scenario: Liga finalizada
- **WHEN** el visitante abre `/<code>/clasificacion` de una liga en `finished`
- **THEN** no ve ninguna banda "Próxima jornada" y sí ve la sección de campeón tal y como existe hoy

#### Scenario: CTA de registro conservado para el propietario
- **WHEN** la banda está visible en una liga en `group_stage` y el visitante es el propietario de la liga
- **THEN** el botón "Registrar resultado" del cabecera de la tabla de clasificación sigue apareciendo en su posición actual y enlazando al panel de administración, y la banda muestra su llamada a la acción al panel

#### Scenario: Banda de próxima jornada sin CTA para visitantes
- **WHEN** la banda está visible en una liga en `group_stage` y el visitante es anónimo o no es el propietario de la liga
- **THEN** la banda muestra la jornada en curso, sus mesas y el enlace a `/<code>/calendario`, y no renderiza ninguna llamada a la acción hacia `/<code>/admin`

#### Scenario: Enlace al calendario
- **WHEN** el visitante abre `/<code>/clasificacion` de una liga en `group_stage`
- **THEN** la banda contiene un enlace a `/<code>/calendario` con una etiqueta coherente (p. ej. "Ver calendario")
