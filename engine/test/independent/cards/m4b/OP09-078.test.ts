/**
 * OP09-078 Gum-Gum Giant (Event, Purple, cost 1, {Straw Hat Crew}/{The Four Emperors}).
 *
 * Card text: "[Counter] DON!! -2, You may trash 1 card from your hand: If your Leader has the {Straw Hat Crew}
 * type, up to 1 of your Leader or Character cards gains +4000 power during this battle. Then, draw 2
 * cards."
 *
 * Rules: CR 8-3-1-6 (DON!! -X returns DON!! from the field to the DON!! deck), CR 8-3-1-3/-4 (costs; a
 * "may" cost that is skipped means the effect does not activate), CR 8-3-3 (a failed "if" resolves
 * nothing), CR 8-4-4-1 ("up to" allows 0), RL-08 (battle-long boosts end with the battle).
 * Reading of "If ..., A. Then, B.": text after a failed "if" does not resolve (CR 8-3-3), so with no
 * {Straw Hat Crew} Leader the draw is skipped too (the text is two sentences, so this is open to doubt).
 */
import { describe, expect, it } from 'vitest';
import { act, attack, decision, fill, passBlock } from '../../helpers.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  BLUE,
  canCounterWith,
  choices,
  count,
  deck,
  decider,
  don,
  donChoices,
  hand,
  kind,
  RED,
  SC,
  skipUnusable,
  theirs,
  trash,
  VAN,
  YL,
} from './kit-a.ts';

const EVENT = 'OP09-078';

function counterStep(
  o: { leader?: string; hand?: string[]; active?: number; characters?: string[] } = {},
) {
  const g = theirs(o.leader ?? YL.robin, {
    hand: o.hand ?? [EVENT, BLUE],
    costArea: { active: o.active ?? 4, rested: 0 },
    characters: o.characters ?? [],
    deck: [SC.bobbin, SC.opera, ...fill(BLUE, 10)],
    life: fill(RED, 4),
  });
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  expect(kind(g)).toBe('counter');
  return g;
}

/**
 * Activate the Event in the Counter Step and pay its costs the way the engine asks for them
 * (optional -> yes, DON!! -2 -> any DON!!, hand trash -> `trashCard`), then pick `target` if asked.
 */
function use(g: TestGame, target: string | null, trashCard: string = BLUE): void {
  const event = g.find('p1', 'hand', EVENT);
  const a = g
    .legal()
    .find((x) => (x.type === 'counter' || x.type === 'activate') && x.card === event)!;
  g.act(a);
  for (let i = 0; i < 20 && decider(g) === 'p1'; i++) {
    const d = decision(g);
    if (!d) return;
    if (d.kind === 'optional') {
      // Say yes when "use" is available; an unusable effect leaves only "no".
      act(g, {
        type: 'optional',
        accept: g.legal().some((x) => x.type === 'optional' && x.accept),
      });
    } else if (d.kind === 'choose') {
      const dons = donChoices(g);
      if (dons.length) {
        act(g, { type: 'pick', choice: dons[0]! });
        continue;
      }
      const offered = choices(g);
      const wanted =
        d.purpose === 'cost'
          ? offered.find((i) => g.card(i).card === trashCard)
          : target && offered.includes(target)
            ? target
            : undefined;
      if (wanted) act(g, { type: 'pick', choice: wanted });
      else if (g.legal().some((x) => x.type === 'done')) act(g, { type: 'done' });
      else if (offered[0]) act(g, { type: 'pick', choice: offered[0] });
      else return;
    } else return;
  }
}

describe('OP09-078 Gum-Gum Giant: [Counter] DON!! -2 and trash 1: +4000 with a {Straw Hat Crew} Leader, then draw 2', () => {
  it('Straw Hat Crew Leader: +4000 on the Leader stops the attack; draw 2; 2 DON!! return to the DON!! deck; 1 card trashed', () => {
    const g = counterStep();
    const donDeckBefore = don(g).deck;
    use(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(hand(g)).toEqual([SC.bobbin, SC.opera].sort());
    expect(trash(g)).toEqual([BLUE, EVENT].sort());
    expect(don(g).deck).toBe(donDeckBefore + 2);
    expect(deck(g)).toHaveLength(10);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
    expect(decider(g)).toBe('p2');
  });

  it('the Event costs 1 DON!! to play, and DON!! -2 returns two MORE DON!! from the field', () => {
    const g = counterStep({ active: 4 });
    use(g, g.leader('p1'));
    // 4 DON!! on the field: 1 rested to play the Event (still on the field), then 2 are returned: 2 left.
    expect(don(g).active + don(g).rested + don(g).given).toBe(2);
  });

  it('may go on one of my Characters instead of the Leader (up to 1 Leader or Character)', () => {
    const g = counterStep({ characters: [VAN.sunny] });
    const sunny = g.find('p1', 'characters', VAN.sunny);
    use(g, sunny);
    expect(g.power(sunny)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-3: a Leader without {Straw Hat Crew} gets no +4000', () => {
    const g = counterStep({ leader: YL.neutral });
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) use(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-3: a Leader without {Straw Hat Crew} also draws nothing (the "Then" is part of the failed "If")', () => {
    const g = counterStep({ leader: YL.neutral });
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) use(g, g.leader('p1'));
    expect(hand(g)).not.toContain(SC.bobbin);
    expect(deck(g)).toHaveLength(12);
  });

  it('CR 8-3-1-3: with no other card to trash (the Event was the only card in hand) the effect cannot activate', () => {
    const g = counterStep({ hand: [EVENT] });
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) use(g, g.leader('p1'));
    skipUnusable(g, 'p1');
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(count(g, 'p1', 'hand')).toBe(0);
  });

  it('CR 8-3-1-3: with fewer than 2 DON!! on the field to return, the effect cannot activate', () => {
    const g = counterStep({ active: 1 });
    // Playing the Event rests the only DON!!; 1 DON!! is on the field, so DON!! -2 is impossible.
    if (canCounterWith(g, g.find('p1', 'hand', EVENT))) use(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(count(g, 'p1', 'hand')).toBeGreaterThanOrEqual(1);
  });

  it('CR 8-3-1-4: the trash is "you may": refusing it means the +4000 and the draw do not happen', () => {
    const g = counterStep();
    const event = g.find('p1', 'hand', EVENT);
    const a = g
      .legal()
      .find((x) => (x.type === 'counter' || x.type === 'activate') && x.card === event)!;
    g.act(a);
    // Answer "no" to any optional; pay DON!! if asked.
    for (let i = 0; i < 10 && decider(g) === 'p1'; i++) {
      const d = decision(g)!;
      if (d.kind === 'optional') act(g, { type: 'optional', accept: false });
      else if (d.kind === 'choose' && donChoices(g).length)
        act(g, { type: 'pick', choice: donChoices(g)[0]! });
      else break;
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).not.toContain(SC.bobbin);
    expect(deck(g)).toHaveLength(12);
  });

  it('RL-08: the +4000 ends with the battle', () => {
    const g = counterStep();
    use(g, g.leader('p1'));
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
