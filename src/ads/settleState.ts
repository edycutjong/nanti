/**
 * The settle sheet's state machine — one-to-one with the UI states in
 * specs/ui.md and the outcomes written to settle_log.
 *
 *   idle ─start→ loading ─loaded→ playing ─earned→ verifying ─verified→ settled
 *                   │                 │                          └─failed→ failed
 *                   └─error→ no_fill  └─closed (no reward)→ closed_early
 *
 * `settled` is reachable ONLY through `verified`, which the caller emits
 * after `Purchases.pollRewardVerification` resolves with a reward. There
 * is no event from the ad itself that reaches `settled`.
 */
export type SettleState =
  'idle' | 'loading' | 'playing' | 'verifying' | 'settled' | 'failed' | 'no_fill' | 'closed_early';

export type SettleEvent =
  | { type: 'start' }
  | { type: 'loaded' }
  | { type: 'load_error' }
  | { type: 'earned' }
  | { type: 'closed' }
  | { type: 'verified' }
  | { type: 'verify_failed' }
  | { type: 'reset' };

export const TERMINAL: readonly SettleState[] = ['settled', 'failed', 'no_fill', 'closed_early'];

export function next(state: SettleState, ev: SettleEvent): SettleState {
  if (ev.type === 'reset') return 'idle';
  switch (state) {
    case 'idle':
      return ev.type === 'start' ? 'loading' : state;
    case 'loading':
      if (ev.type === 'loaded') return 'playing';
      if (ev.type === 'load_error') return 'no_fill';
      return state;
    case 'playing':
      if (ev.type === 'earned') return 'verifying';
      if (ev.type === 'closed') return 'closed_early';
      if (ev.type === 'load_error') return 'no_fill';
      return state;
    case 'verifying':
      if (ev.type === 'verified') return 'settled';
      if (ev.type === 'verify_failed') return 'failed';
      // The ad closing while we poll does not change the verification outcome.
      return state;
    default:
      return state;
  }
}

/** The settle_log outcome for a terminal state. */
export function outcomeOf(
  state: SettleState,
): 'verified' | 'failed' | 'no_fill' | 'closed_early' | null {
  switch (state) {
    case 'settled':
      return 'verified';
    case 'failed':
    case 'no_fill':
    case 'closed_early':
      return state;
    default:
      return null;
  }
}
