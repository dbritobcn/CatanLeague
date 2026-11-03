## Context

Next.js App Router, React 19, TypeScript. Domain/application/infrastructure remain intact. Approved visual sources: option 2 desktop and its tablet/mobile adaptations; screenshots are retained outside the checkout in /workspace/generated_images.

## Goals / Non-Goals

**Goals:** faithful forest/ivory visual identity, responsive navigation, legible scores, usable forms and real empty/in-progress/completed states.

**Non-Goals:** authentication, domain changes, sample data in the live league, new routes or replacement persistence.

## Decisions

- Share a small client-side navigation using usePathname; keep data-bearing pages server-rendered. This avoids moving business queries into client code.
- Use a 232px desktop sidebar, 104px tablet rail and fixed bottom navigation below 640px. Reserve bottom safe-area spacing; keep all route links labelled.
- Use self-hosted Inter through Fontsource and Phosphor library icons. Reuse the supplied ICO as the brand emblem/favicon; generate the panoramic landscape from the selected visual reference because the inline original has no local file path.
- Preserve semantic table markup. On mobile, show position/name/points/PJ and expose finishing counts in an accessible expandable section instead of horizontal overflow.
- Use actual schedule progress and contextual actions; registration shows setup guidance instead of mock standings. Provisional qualification copy must not promise final places before the group stage ends.
- Use isolated LEAGUE_DATA_FILE for browser smoke tests and visual examples. Never seed or reset the user's league.

## Risks / Trade-offs

- Fixed mobile navigation can obscure content → reserve safe-area-aware padding and verify at 320/390px.
- Long player names can overflow → wrap within fixed table columns and test 40-character names.
- Generated designs have approximate dimensions → normalize the supplied screenshots to their CSS viewport before comparing.
- Browser connector is absent → use installed Chromium via temporary Playwright for screenshots and interactions; record this substitution in QA.

## Migration Plan

Install locked dependencies, build, run existing domain tests and isolated browser workflow, then restart the development server with its original data path. Rollback is limited to presentation files/assets/dependencies; no migration is needed.

## Open Questions

None blocking; desktop/tablet/mobile direction has been approved.
