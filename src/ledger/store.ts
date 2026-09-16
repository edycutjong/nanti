/**
 * expo-sqlite — one ledger row, a settle_log table, two prefs.
 * The ADS balance is NOT here (it is `last_ads_seen`, an optimistic cache
 * for the pill's first paint only — the server read always wins).
 */
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import type { SettleLogRow } from '../ads/settle';
import type { LocalePref } from '../i18n/t';
import { EMPTY_LEDGER, type Ledger } from './tab';

let db: SQLiteDatabase | null = null;

export function open(): SQLiteDatabase {
  if (db) return db;
  db = openDatabaseSync('nanti.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ledger (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      exported      INTEGER NOT NULL DEFAULT 0,
      forgiven      INTEGER NOT NULL DEFAULT 0,
      pro_exports   INTEGER NOT NULL DEFAULT 0,
      last_ads_seen INTEGER NOT NULL DEFAULT 0,
      last_city     TEXT    NOT NULL DEFAULT 'Jakarta',
      locale        TEXT    NOT NULL DEFAULT 'auto'
    );
    INSERT OR IGNORE INTO ledger (id) VALUES (1);
    CREATE TABLE IF NOT EXISTS settle_log (
      impression_id  TEXT PRIMARY KEY,
      t_earned       INTEGER NOT NULL,
      t_verified     INTEGER,
      t_balance      INTEGER,
      balance_before INTEGER NOT NULL,
      balance_after  INTEGER,
      outcome        TEXT NOT NULL
    );
  `);
  return db;
}

interface Row {
  exported: number;
  forgiven: number;
  pro_exports: number;
  last_ads_seen: number;
  last_city: string;
  locale: string;
}

export interface Prefs {
  lastCity: string;
  locale: LocalePref;
  lastAdsSeen: number;
}

export function load(): { ledger: Ledger; prefs: Prefs } {
  const r = open().getFirstSync<Row>('SELECT * FROM ledger WHERE id = 1');
  if (!r)
    return { ledger: EMPTY_LEDGER, prefs: { lastCity: 'Jakarta', locale: 'auto', lastAdsSeen: 0 } };
  return {
    ledger: { exported: r.exported, forgiven: r.forgiven, proExports: r.pro_exports },
    prefs: {
      lastCity: r.last_city,
      locale: (r.locale as LocalePref) || 'auto',
      lastAdsSeen: r.last_ads_seen,
    },
  };
}

export function saveLedger(l: Ledger): void {
  open().runSync(
    'UPDATE ledger SET exported = ?, forgiven = ?, pro_exports = ? WHERE id = 1',
    l.exported,
    l.forgiven,
    l.proExports,
  );
}

export function savePrefs(p: Partial<Prefs>): void {
  const d = open();
  if (p.lastCity !== undefined)
    d.runSync('UPDATE ledger SET last_city = ? WHERE id = 1', p.lastCity);
  if (p.locale !== undefined) d.runSync('UPDATE ledger SET locale = ? WHERE id = 1', p.locale);
  if (p.lastAdsSeen !== undefined)
    d.runSync('UPDATE ledger SET last_ads_seen = ? WHERE id = 1', p.lastAdsSeen);
}

export function appendSettle(row: SettleLogRow): void {
  open().runSync(
    'INSERT OR REPLACE INTO settle_log (impression_id, t_earned, t_verified, t_balance, balance_before, balance_after, outcome) VALUES (?, ?, ?, ?, ?, ?, ?)',
    row.impressionId,
    row.tEarned,
    row.tVerified,
    row.tBalance,
    row.balanceBefore,
    row.balanceAfter,
    row.outcome,
  );
}

export function recentSettles(limit = 5): SettleLogRow[] {
  return open()
    .getAllSync<{
      impression_id: string;
      t_earned: number;
      t_verified: number | null;
      t_balance: number | null;
      balance_before: number;
      balance_after: number | null;
      outcome: string;
    }>('SELECT * FROM settle_log ORDER BY t_earned DESC LIMIT ?', limit)
    .map((r) => ({
      impressionId: r.impression_id,
      tEarned: r.t_earned,
      tVerified: r.t_verified,
      tBalance: r.t_balance,
      balanceBefore: r.balance_before,
      balanceAfter: r.balance_after,
      outcome: r.outcome as SettleLogRow['outcome'],
    }));
}

/** Every row, for scripts/settle-log-export.ts via the dev-only deep link. */
export function allSettles(): SettleLogRow[] {
  return recentSettles(100000);
}
