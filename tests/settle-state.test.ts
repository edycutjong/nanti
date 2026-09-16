import { describe, expect, it } from 'vitest';
import {
  TERMINAL,
  next,
  outcomeOf,
  type SettleEvent,
  type SettleState,
} from '../src/ads/settleState';

const run = (events: SettleEvent['type'][]) =>
  events.reduce<SettleState>((s, type) => next(s, { type } as SettleEvent), 'idle');

describe('settle state machine', () => {
  it('the happy path: start → loaded → earned → verified = settled', () => {
    expect(run(['start', 'loaded', 'earned', 'verified'])).toBe('settled');
  });
  it('no fill', () => {
    expect(run(['start', 'load_error'])).toBe('no_fill');
  });
  it('closed before the reward', () => {
    expect(run(['start', 'loaded', 'closed'])).toBe('closed_early');
  });
  it('verification failure keeps the tab', () => {
    expect(run(['start', 'loaded', 'earned', 'verify_failed'])).toBe('failed');
  });
  it('the ad closing while verifying does not change the outcome', () => {
    expect(run(['start', 'loaded', 'earned', 'closed'])).toBe('verifying');
    expect(run(['start', 'loaded', 'earned', 'closed', 'verified'])).toBe('settled');
  });
  it('settled is unreachable without a verified event (exhaustive over event sequences ≤ 4)', () => {
    const events: SettleEvent['type'][] = [
      'start',
      'loaded',
      'load_error',
      'earned',
      'closed',
      'verify_failed',
    ];
    const walk = (s: SettleState, depth: number) => {
      if (depth === 0) return;
      for (const e of events) {
        const n = next(s, { type: e } as SettleEvent);
        expect(n).not.toBe('settled');
        walk(n, depth - 1);
      }
    };
    walk('idle', 4);
  });
  it('reset returns to idle from anywhere; terminal states ignore other events', () => {
    for (const s of TERMINAL) {
      expect(next(s, { type: 'reset' })).toBe('idle');
      expect(next(s, { type: 'earned' })).toBe(s);
    }
  });
  it('outcomes map to the settle_log vocabulary', () => {
    expect(outcomeOf('settled')).toBe('verified');
    expect(outcomeOf('failed')).toBe('failed');
    expect(outcomeOf('no_fill')).toBe('no_fill');
    expect(outcomeOf('closed_early')).toBe('closed_early');
    expect(outcomeOf('playing')).toBeNull();
  });
});
