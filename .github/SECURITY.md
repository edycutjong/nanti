# Security Policy

## Supported Versions

| Version         | Supported |
| --------------- | --------- |
| latest (`main`) | ✅        |

## What Nanti holds

The letters never leave the phone except through the share sheet the user opens — Nanti has no
server, no account and never uploads a letter. On the device: a one-row ledger (letters delivered,
forgiven, last city, language) and a `settle_log` of impression ids and timestamps, in the app's
private SQLite database. Purchases go through RevenueCat and Google Play Billing; ads through
AdMob. The app holds only RevenueCat **public** SDK keys and AdMob **public** ids, sourced from the
environment at build time (`.env.example`).

## What is tested, not just claimed

- **The client cannot pay its own tab.** `debt = clamp(exported − ADS, 0, 1)`; `ADS` is a RevenueCat
  virtual currency the app only reads. `tests/boundary.test.ts` proves no client event lowers the
  debt, `src/` contains no settled-counter increment, no REST call and no secret, and the only path
  to the `settled` state is after `pollRewardVerification` returns a `virtual_currency` reward.
  `tests/exhaustive.test.ts` walks 70,602 ledger transitions and 299,592 settle-machine paths.
- **Field input cannot inject into the PDF.** Every value is HTML-escaped (`tests/format.test.ts`,
  `tests/templates.test.ts`).
- **No secret in the tree or its history.** gitleaks (full history) and TruffleHog run on every push;
  keys and the upload keystore live in `~/.config/nanti/`, never in the repo.

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities. Instead,
report them privately:

- Email **edy.cu@live.com**, or
- Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) (Security → Report a vulnerability).

You'll get an acknowledgment within 48 hours and a resolution timeline after
triage. Please give us a reasonable window to patch before public disclosure.
