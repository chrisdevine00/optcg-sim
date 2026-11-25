/**
 * EB02-053 Myskina Olga (Character, Yellow, cost 3, 4000, Counter +1000, {Alchemi}, Wisdom).
 *
 * Card text: "[On Play]/[On K.O.] Look at up to 1 card from the top of your or your opponent's Life
 * cards and place it at the top or bottom of the Life cards."
 *
 * Rules: rules-digest 108 / QA-GR (a looked-at Life card returns to its OWNER's Life, at the top or
 * the bottom), CR 4-8-1 ("up to 1": may be none), CR 3-10-2/3-10-3 (Life is secret; looking
 * keeps the facing), 104 (a [Trigger] only activates on damage: moving a Life card is not damage).
 * Open M6b-Q81 (the face state of the placed card; whether the placing end is told to the other
 * player): only the order and the owner are asserted. Both effects share one script ability set;
 * [On K.O.] is the owner's effect (the owner of the K.O.'d Character decides).
 * Scenery (printed): OP01-010 Komachiyo / OP01-012 Sai / OP01-023 Marco / OP01-018 Hajrudin
 * (vanilla Red Characters, cost 1 to 4: Life markers), OP01-104 Speed (has a [Trigger]),
 * OP02-007 Thatch (8000, the attacker), OP10-079 God Thread (Event, cost 5, K.O. cost 5 or less).
 */
import { describe, expect, it } from 'vitest';
import type { CardId, PlayerSpec } from '@optcg/engine';
import { decision, endTurn, noDefence } from '../../helpers.ts';
import { myTurn, side, theirTurn } from '../kit.ts';
import {
  anomalies,
  answerCount,
  asksOption,
  BLUE,
  L7,
  lifeFaces,
  lifeOf,
  need,
  optionIds,
  pickOption,
  put,
  RED,
  S7,
} from './kit-w7a.ts';

const ID = 'EB02-053';
const [A, B, C, D] = [S7.c1, S7.c2, S7.c3, S7.c4];

function start(
  mine: PlayerSpec['life'] = [A, B, C],
  theirs: CardId[] = [D, S7.c5, S7.c6],
  p1: Partial<PlayerSpec> = {},
) {
  return myTurn(
    side(L7.luffy, BLUE, { hand: [ID], life: mine, costArea: { active: 3, rested: 0 }, ...p1 }),
    side(L7.crocodile, RED, { life: theirs }),
  );
}

/** p2 attacks p1's rested Olga with Thatch (8000 vs 4000); p1 does not defend. Leaves p1 at Olga's [On K.O.]. */
function koedInBattle(mine: CardId[] = [A, B, C], theirs: CardId[] = [D, S7.c5, S7.c6]) {
  const g = theirTurn(
    side(L7.luffy, BLUE, { life: mine, characters: [{ card: ID, rested: true }] }),
    side(L7.crocodile, RED, { life: theirs, characters: [S7.c6] }),
  );
  g.act({
    type: 'attack',
    attacker: g.find('p2', 'characters', S7.c6),
    target: g.find('p1', 'characters', ID),
  });
  noDefence(g);
  return g;
}

describe("EB02-053 Myskina Olga: [On Play]/[On K.O.] look at up to 1 Life card (yours or the opponent's) and place it at the top or bottom", () => {
  it('[On Play], my top Life card to the bottom: it stays in my Life, the rest keep their order', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    pickOption(g, 'you');
    pickOption(g, 'bottom');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([B, C, A]);
    expect(lifeOf(g, 'p2')).toEqual([D, S7.c5, S7.c6]);
    expect(g.zone('p1', 'hand')).toHaveLength(0); // looking adds nothing to the hand
    expect(anomalies(g)).toBe(0);
  });

  it('"top" puts the looked-at card back where it was', () => {
    const g = start();
    put(g, ID);
    pickOption(g, 'you');
    pickOption(g, 'top');
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
    expect(lifeOf(g, 'p2')).toEqual([D, S7.c5, S7.c6]);
  });

  it("the opponent's top card goes to the bottom of the OPPONENT's Life (rules-digest 108)", () => {
    const g = start();
    put(g, ID);
    pickOption(g, 'opponent');
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([S7.c5, S7.c6, D]);
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
    expect(g.life('p1')).toBe(3);
    expect(g.life('p2')).toBe(3);
  });

  it('"up to 1": choosing none changes nothing and asks nothing more', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(optionIds(g)).toContain('none');
    pickOption(g, 'none');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
    expect(lifeOf(g, 'p2')).toEqual([D, S7.c5, S7.c6]);
  });

  it('the choice offers both Life areas and "none" when both have cards', () => {
    const g = start();
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(optionIds(g).sort()).toEqual(['none', 'opponent', 'you']);
  });

  it("with no Life of my own only the opponent's Life (or none) can be chosen", () => {
    const g = start([], [D, S7.c5]);
    put(g, ID);
    need(g, 'choose', 'p1');
    expect(optionIds(g)).not.toContain('you');
    expect(optionIds(g)).toContain('opponent');
    pickOption(g, 'opponent');
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([S7.c5, D]);
    expect(lifeOf(g, 'p1')).toEqual([]);
  });

  it('with no Life on either side nothing happens: no prompt, the Character is just played', () => {
    const g = start([], []);
    put(g, ID);
    expect(decision(g)?.kind).toBe('main');
    expect(g.find('p1', 'characters', ID)).toBeTruthy();
    expect(anomalies(g)).toBe(0);
  });

  it('a [Trigger] card on top of the Life area that is looked at and moved does not activate (not damage)', () => {
    const g = start([S7.speed, B, C]);
    put(g, ID);
    pickOption(g, 'you');
    pickOption(g, 'bottom');
    expect(decision(g)?.kind).toBe('main');
    expect(lifeOf(g, 'p1')).toEqual([B, C, S7.speed]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]); // Speed was not played
    expect(g.zone('p1', 'hand')).toHaveLength(0);
  });

  it('a face-up top card changes place without changing owner or Life count (its facing is not asserted: M6b-Q81)', () => {
    const g = start([{ card: A, faceUp: true }, B, C]);
    put(g, ID);
    pickOption(g, 'you');
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p1')).toEqual([B, C, A]);
    expect(lifeFaces(g, 'p1').slice(0, 2)).toEqual([false, false]);
  });

  it('what is asked never depends on which cards are in the Life areas (two positions, same prompts)', () => {
    const shape = (mine: CardId[], theirs: CardId[]) => {
      const g = start(mine, theirs);
      put(g, ID);
      const first = decision(g);
      const opts1 = optionIds(g);
      pickOption(g, 'you');
      const second = decision(g);
      return [first?.kind, first?.prompt, opts1, second?.kind, second?.prompt, optionIds(g)];
    };
    expect(shape([A, B, C], [D, S7.c5, S7.c6])).toEqual(
      shape([S7.speed, S7.c7, S7.c1], [S7.c2, S7.c3, S7.c4]),
    );
  });

  it("[On K.O.] in battle: its owner gets the same look (the opponent's Life is the one looked at here)", () => {
    const g = koedInBattle();
    expect(g.zone('p1', 'characters')).toHaveLength(0); // K.O.'d
    need(g, 'choose', 'p1');
    expect(optionIds(g).sort()).toEqual(['none', 'opponent', 'you']);
    pickOption(g, 'opponent');
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p2')).toEqual([S7.c5, S7.c6, D]);
    expect(lifeOf(g, 'p1')).toEqual([A, B, C]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it("[On K.O.] by an opponent's effect also looks, and my own Life card goes to the bottom of my Life", () => {
    const g = theirTurn(
      side(L7.luffy, BLUE, { life: [A, B, C], characters: [ID] }),
      side(L7.crocodile, RED, {
        life: [D, S7.c5],
        hand: ['OP10-079'],
        costArea: { active: 5, rested: 0 },
      }),
    );
    put(g, 'OP10-079');
    // God Thread: K.O. up to 1 of the opponent's Characters with cost 5 or less (Olga is the only one).
    if (decision(g)?.kind === 'choose') {
      g.act({ type: 'pick', choice: g.find('p1', 'characters', ID) });
    }
    // God Thread's second half (p2 adds a DON!!) is asked first; Olga's [On K.O.] waits and is p1's.
    answerCount(g, 1, 'p2');
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    need(g, 'choose', 'p1');
    pickOption(g, 'you');
    pickOption(g, 'bottom');
    expect(lifeOf(g, 'p1')).toEqual([B, C, A]);
    expect(g.zone('p1', 'trash').map((c) => c.card)).toEqual([ID]);
  });

  it("a Character that is K.O.'d with no Life anywhere asks nothing", () => {
    const g = koedInBattle([], []);
    // p1 at 0 Life takes no damage from a Character battle; Olga is K.O.'d; nothing to look at.
    expect(g.zone('p1', 'characters')).toHaveLength(0);
    expect(['main', 'trigger', 'block', 'counter']).toContain(decision(g)?.kind ?? 'none');
    expect(asksOption(g, 'p1')).toBe(false);
    endTurn(g);
  });
});
