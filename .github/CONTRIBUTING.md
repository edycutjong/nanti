# Contributing

Thanks for your interest in improving Nanti! ✉️

## Getting Started

1. Fork the repo and branch from `main`: `git checkout -b feat/your-feature`
2. Install: `npm install --legacy-peer-deps`
3. Copy the env template: `cp .env.example .env` (the tests need none of it)
4. Run the no-credential suite: `npm test && npm run bench && npm run verify:offline && npm run ablation`
5. Run the app: `npx expo prebuild --platform android && npx expo run:android` (a dev build — RevenueCat + AdMob do not run in Expo Go)

## Before You Open a PR

- `npm run ci` passes (prettier, eslint, tsc, vitest + coverage, bench, verify:offline, ablation, readiness).
- `npm run bundle:check` passes (Metro must bundle — a green typecheck is not proof).
- **Hard rule: the client never pays the tab.** No code path may increment a settled counter,
  grant on `EARNED_REWARD`, grant on `CLOSED`, or mark the tab paid without a server balance read.
  `npm run ablation` and `tests/boundary.test.ts` enforce it; a PR that weakens either is closed.
- Template changes regenerate the golden files deliberately: `npm run golden`, then review the
  HTML diff in the PR. `npm test` byte-compares against them.
- Fixture names, companies and schools stay fictional (rules L166/L244 hygiene).
- Regression tests are named after the defect they pin (`tests/regressions.test.ts`). Add one.
- Commits follow Angular convention (`feat:`, `fix:`, `docs:`, `chore:`) — `release.yml` derives the version.

## Reporting Bugs / Requesting Features

Open an issue using the provided templates. Include repro steps, expected vs. actual behavior,
and the device / Android version. For a wrong letter layout, attach the PDF (fictional data only).
