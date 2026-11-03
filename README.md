# Liga de Catán

Web para gestionar una liga de Catán entre amigos: clasificación, calendario y administración.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests de dominio
```

Los datos se guardan en `data/league.json` (configurable con `LEAGUE_DATA_FILE`).

## Reglas

- Partidas de 4 jugadores. Puntos: 1º → 3, 2º → 2, 3º → 1, 4º → 0.
- Al iniciar la liga se genera la liguilla: todos se enfrentan al menos una vez, ninguna partida
  repite combinación de jugadores y todos juegan el mismo número de partidas.
- Al introducir el último resultado de la liguilla se crea la final con los 4 primeros
  (desempate: puntos, nº de 1º, 2º y 3º puestos, nombre).
- Los resultados de la liguilla se pueden corregir hasta que se juegue la final (la final se recalcula).

## Arquitectura (hexagonal)

```
src/
  domain/          Núcleo sin dependencias: agregado League, Match, Standing, reglas de puntuación
                   y el servicio ScheduleGenerator (+ BalancedCoveringScheduleGenerator).
  application/     Casos de uso (AddPlayer, StartLeague, RecordMatchResult, GetStandings…),
                   puertos (LeagueRepository, IdGenerator, Shuffler) y vistas de lectura.
  infrastructure/  Adaptadores: repositorio JSON / en memoria, UUID, barajado; container.ts es la
                   raíz de composición donde se conectan puertos y adaptadores.
  presentation/    Server actions y componentes React (adaptador de entrada).
  app/             Rutas de Next.js: /clasificacion, /calendario, /admin.
```

Para cambiar la persistencia (p. ej. a una base de datos) basta con implementar `LeagueRepository`
y registrarlo en `src/infrastructure/container.ts`.
