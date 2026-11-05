# Liga de Catán

Plataforma para crear y seguir ligas de Catán entre amigos: cada liga tiene su
propia URL pública (`/liga-cholos/clasificacion`), un panel de administración
para su creador y persistencia en Supabase.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests de dominio y aplicación
```

## Puesta en marcha

1. Copia `.env.example` a `.env.local` y rellena las claves de tu proyecto
   Supabase (Dashboard → Project Settings → API Keys: publishable y secret).
   Para desarrollo sin Supabase puede usarse `LEAGUE_PERSISTENCE=file` (ligas en
   `data/leagues/<code>.json`).
2. Ejecuta `supabase/migrations/0001_leagues.sql` en el SQL Editor de tu
   proyecto (tabla `leagues` + RLS).
3. En Authentication → Sign In / Up → Email, deja activo el provider de email y
   **desactiva "Confirm email"** para que el registro entre directamente.
4. En producción (Vercel), define `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y
   `SUPABASE_SERVICE_ROLE_KEY`.

## Funcionamiento

- Cualquier visitante con cuenta (email + contraseña) puede **crear una liga**;
  su nombre se convierte en el slug de su URL (validado, único, inmutable) y su
  creador es el único que puede gestionarla.
- La homepage lista todas las ligas (estado, progreso, líder o campeón).
- Ver clasificación y calendario es público; iniciar, reiniciar, registrar
  resultados y eliminar la liga requiere ser el propietario (verificado en
  cada server action, con RLS como red de seguridad en la base de datos).
- Reglas: partidas de 4 jugadores (1º → 3, 2º → 2, 3º → 1, 4º → 0), liguilla
  con todos contra todos sin repetir combinaciones, final con los 4 primeros
  (desempate: puntos, nº de 1º, 2º y 3º puestos, nombre).
- Los resultados se pueden corregir hasta que se juegue la final (la final se
  recalcula).

## Arquitectura (hexagonal)

```
src/
  domain/          Núcleo sin dependencias: agregado League, Match, Standing, reglas de
                   puntuación y el servicio ScheduleGenerator (+ BalancedCoveringScheduleGenerator).
                   No conoce códigos de liga, usuarios ni sesiones.
  application/     Casos de uso (CreateLeague, AddPlayer, StartLeague, RecordMatchResult,
                   GetStandings…), puertos (LeagueRepository multi-liga, IdGenerator, Shuffler),
                   tubería de slug (src/application/slug.ts) y vistas de lectura.
  infrastructure/  Adaptadores: repositorio Supabase (jsonb), JSON por archivos para dev,
                   en memoria para tests; container.ts es la raíz de composición donde se
                   conectan puertos y adaptadores (selector por LEAGUE_PERSISTENCE).
  presentation/    Server actions (frontera de autorización), guards de auth/propiedad,
                   helpers de sesión Supabase y componentes React.
  app/             Rutas: / (galería), /crear, /login y /[code]/{clasificacion,
                   calendario, admin}. src/proxy.ts refresca la sesión.
```

Para cambiar la persistencia basta con implementar `LeagueRepository` y
registrarlo en `src/infrastructure/container.ts`. Los adaptadores se validan
con un contrato de tests compartido (`tests/LeagueRepository.contract.test.ts`;
los tests de Supabase se activan con `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`).
