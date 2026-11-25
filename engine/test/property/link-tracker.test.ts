/**
 * The linkage check of leaks.test.ts must stay sharp (review M4b-09): the narrow "revealed in
 * Life, same handle" exemption lets a legitimate repeat through, and each planted leak below
 * (a real relink) still fails.
 */
import { describe, expect, it } from 'vitest';
import { LinkTracker } from '../support/link-tracker.ts';

describe('LinkTracker', () => {
  it('a card seen, hidden and shown again under a new handle is fine', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'start');
    t.hiddenInView('p1', '$a', 'hand');
    t.note('p1', '$a', 'h2', 'later');
    expect(t.relinks).toBe(0);
  });

  it('PLANTED LEAK: a hand card hidden and shown again under the SAME handle is a relink', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'start');
    t.hiddenInView('p1', '$a', 'hand');
    expect(() => t.note('p1', '$a', 'h1', 'returns')).toThrow(/relinked/);
  });

  it('a Life card revealed in place keeps its handle when it is revealed or moved later (exempt, once)', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'revealed');
    t.revealed('p1', '$a', 'h1', 'life');
    t.hiddenInView('p1', '$a', 'life'); // the view turns it hidden again
    t.note('p1', '$a', 'h1', 'event CardMoved.instance'); // the same card, moving now
    expect(t.exempted).toBe(1);
    expect(t.relinks).toBe(0);
  });

  it('PLANTED LEAK: after the exemption is spent, the same handle again is a relink', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'revealed');
    t.revealed('p1', '$a', 'h1', 'life');
    t.hiddenInView('p1', '$a', 'life');
    t.note('p1', '$a', 'h1', 'moved to the deck'); // exempt, spent
    t.hiddenInView('p1', '$a', 'deck');
    expect(() => t.note('p1', '$a', 'h1', 'back from the deck')).toThrow(/relinked/);
  });

  it('PLANTED LEAK: a Life card revealed under one handle may not return under another one it was shown before', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'start');
    t.note('p1', '$a', 'h2', 'rekeyed');
    t.revealed('p1', '$a', 'h2', 'life');
    t.hiddenInView('p1', '$a', 'life');
    expect(() => t.note('p1', '$a', 'h1', 'an older handle')).toThrow(/relinked/);
  });

  it('PLANTED LEAK: a card revealed from a HAND gets no Life exemption', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'revealed');
    t.revealed('p1', '$a', 'h1', 'hand');
    t.hiddenInView('p1', '$a', 'life'); // it is somewhere hidden that is not the hand
    expect(() => t.note('p1', '$a', 'h1', 'returns')).toThrow(/relinked/);
  });

  it('the exemption is per viewer and per card', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'x');
    t.note('p1', '$b', 'g1', 'x');
    t.revealed('p1', '$a', 'h1', 'life');
    t.hiddenInView('p1', '$a', 'life');
    t.hiddenInView('p1', '$b', 'life');
    expect(() => t.note('p1', '$b', 'g1', 'y')).toThrow(/relinked/);
  });

  it('a deck top revealed in place keeps its handle when it is milled or played later (exempt, once)', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'revealed');
    t.revealed('p1', '$a', 'h1', 'deck');
    t.hiddenInView('p1', '$a', 'deck'); // the view shows the position hidden again
    t.note('p1', '$a', 'h1', 'event CardMoved.newInstance'); // the same card, milled now
    expect(t.exempted).toBe(1);
    expect(t.relinks).toBe(0);
  });

  it('PLANTED LEAK: a revealed deck top that was shuffled away and comes back under its old handle is a relink', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'revealed');
    t.revealed('p1', '$a', 'h1', 'deck');
    t.hiddenInView('p1', '$a', 'deck');
    t.note('p1', '$a', 'h2', 'moved after a shuffle: a fresh key'); // new handle, no exemption used
    t.hiddenInView('p1', '$a', 'life');
    expect(() => t.note('p1', '$a', 'h1', 'the revealed handle again')).toThrow(/relinked/);
  });

  it('PLANTED LEAK: a card never revealed from the deck gets no deck exemption', () => {
    const t = new LinkTracker('t');
    t.note('p1', '$a', 'h1', 'seen');
    t.hiddenInView('p1', '$a', 'deck');
    expect(() => t.note('p1', '$a', 'h1', 'returns')).toThrow(/relinked/);
  });
});
