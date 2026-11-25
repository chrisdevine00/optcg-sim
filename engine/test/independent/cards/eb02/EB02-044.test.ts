/**
 * EB02-044 Sengoku (Black Character, cost 7, 7000, Counter +1000, {Navy}, [Blocker]).
 *
 * Card text: "[Blocker] [On Play] Play up to 1 black "Navy" type Character card with a cost of 4 or
 * less from your trash rested."
 *
 * Rules: "up to 1" may be 0; the quoted type matches any type including "Navy" (CR 2-4-3-1); the card
 * is played from the trash and enters RESTED (an effect may specify the state, CR 3-7-5 exception);
 * a Blocker may rest to become the new target of an attack (CR 10-1-4).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  blockers,
  chars,
  decision,
  kind,
  LE,
  mine,
  need,
  none,
  offeredIds,
  pickCards,
  playRaw,
  SE,
  theirs,
  trash,
  noDefence,
  skipEmptyPick,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const SENGOKU = 'EB02-044';
/** OP17-089 Jaguar.D.Saul: Black, base cost 4, {Giant}/{Former Navy}/{Elbaph}; its text only applies on the field. */
const FORMER_NAVY = 'OP17-089';

function start(inTrash: string[]) {
  const g = mine(LE.luffy, { hand: [SENGOKU], trash: inTrash });
  playRaw(g, SENGOKU);
  return g;
}

describe('EB02-044 Sengoku: printed values and [Blocker]', () => {
  it('cost 7, 7000 power, Counter +1000, [Blocker]', () => {
    const g = mine(LE.luffy, { characters: [SENGOKU] });
    const s = ch(g, 'p1', SENGOKU);
    expect(g.card(s).cost).toBe(7);
    expect(g.power(s)).toBe(7000);
    expect(g.card(s).counter).toBe(1000);
    expect(g.card(s).keywords).toContain('Blocker');
  });

  it('blocks an attack on the Leader', () => {
    const g = theirs(LE.luffy, { characters: [SENGOKU] });
    attack(g, g.leader('p2'), g.leader('p1'));
    need(g, 'block', 'p1');
    expect(blockers(g)).toEqual([ch(g, 'p1', SENGOKU)]);
    act(g, { type: 'block', blocker: ch(g, 'p1', SENGOKU) });
    noDefence(g);
    expect(g.life('p1')).toBe(4);
  });
});

describe('EB02-044 Sengoku: [On Play] play a black "Navy" Character with cost 4 or less from the trash rested', () => {
  it('offers black Navy Characters with cost 4 or less in the trash, and only those', () => {
    const g = start([SE.komille1, SE.momonga4, SE.garp5, SE.fullbodyBlue4, SE.laboon, SE.mohji]);
    need(g, 'choose', 'p1');
    // Cost 5 Navy, a blue Navy, a black non-Navy and a blue non-Navy are all excluded.
    expect(offeredIds(g)).toEqual([SE.komille1, SE.momonga4].sort());
  });

  it('the played card comes from the trash and enters RESTED', () => {
    const g = start([SE.komille1, SE.momonga4]);
    pickCards(g, [SE.momonga4]);
    expect(chars(g)).toEqual([SENGOKU, SE.momonga4].sort());
    expect(g.card(ch(g, 'p1', SE.momonga4)).rested).toBe(true);
    expect(g.card(ch(g, 'p1', SENGOKU)).rested).toBe(false);
    expect(trash(g)).toEqual([SE.komille1]);
  });

  it('boundary: cost 4 qualifies, cost 5 does not', () => {
    const g = start([SE.momonga4, SE.garp5]);
    expect(offeredIds(g)).toEqual([SE.momonga4]);
    none(g);
  });

  // DISAGREEMENT (DISAGREEMENTS-b.md, EB02-044 #1): the engine offers nothing for a "Former Navy" card.
  it.fails('"type including": a "Former Navy" Character with printed cost 4 qualifies', () => {
    const g = start([FORMER_NAVY, SE.laboon]);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([FORMER_NAVY]);
    none(g);
  });

  it('"up to 1": may play nothing; the trash is untouched', () => {
    const g = start([SE.komille1, SE.momonga4]);
    none(g);
    expect(chars(g)).toEqual([SENGOKU]);
    expect(trash(g)).toEqual([SE.komille1, SE.momonga4].sort());
    expect(kind(g)).toBe('main');
  });

  it('with no qualifying card in the trash the effect does nothing and no card is moved', () => {
    const g = start([SE.garp5, SE.laboon]);
    skipEmptyPick(g);
    expect(chars(g)).toEqual([SENGOKU]);
    expect(trash(g)).toEqual([SE.garp5, SE.laboon].sort());
  });

  it('plays at most 1 card', () => {
    const g = start([SE.komille1, SE.momonga4]);
    pickCards(g, [SE.komille1]);
    expect(decision(g)?.kind).toBe('main');
    expect(chars(g)).toHaveLength(2);
  });

  it("the opponent's trash is not a source", () => {
    const g = mine(LE.luffy, { hand: [SENGOKU], trash: [] }, { trash: [SE.komille1] });
    playRaw(g, SENGOKU);
    skipEmptyPick(g);
    expect(trash(g, 'p2')).toEqual([SE.komille1]);
  });
});
