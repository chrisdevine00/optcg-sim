/**
 * OP13-100 Jewelry Bonney (Leader, Yellow, 5000, 5 Life, {Bonney Pirates}/{Egghead}).
 *
 * Card text: "[Your Turn] [Once Per Turn] This effect can be activated when you play a Character with
 * a [Trigger]. Give up to 2 rested DON!! cards to 1 of your Leader or Character cards."
 *
 * Rules: CR 10-2-13 ([Once Per Turn], counted on resolution), CR 6-5-5 (given DON!!), CR 4-8-1
 * ("up to" may be fewer), CR 8-3-2-4 ([Your Turn]). Scenery: OP01-104 Speed (Purple, cost 2,
 * [Trigger] Play this card), OP06-108 Tenguyama Hitetsu (Yellow, cost 1, has a [Trigger]),
 * OP04-113 Rabiyan (Yellow, cost 2, [Trigger]), OP06-105 Genbo (Yellow, cost 3, no [Trigger]).
 */
import { describe, expect, it } from 'vitest';
import type { TestGame } from '../../../fixtures/index.ts';
import {
  activateTrigger,
  at,
  atMain,
  BLUE,
  chars,
  hitLeader,
  theirs,
  choices,
  decision,
  don,
  giveCount,
  kind,
  LD13,
  mine,
  need,
  offeredIds,
  pickRaw,
  playRaw,
  S13,
  SC15,
  trash,
} from './kit-op13d.ts';

const ID = LD13.bonney;
const SPEED = S13.speed;
const HITETSU = 'OP06-108';
const RABIYAN = 'OP04-113';
const GENBO = S13.genbo;

function start(
  o: { hand?: string[]; chars?: string[]; p2?: string[]; active?: number; rested?: number } = {},
): TestGame {
  return mine(
    ID,
    {
      hand: o.hand ?? [SPEED, GENBO, RABIYAN],
      characters: o.chars ?? [],
      costArea: { active: o.active ?? 10, rested: o.rested ?? 0 },
    },
    { characters: o.p2 ?? [SC15.red3] },
  );
}

const play = (g: TestGame, card: string) => playRaw(g, g.find('p1', 'hand', card));
const counts = (g: TestGame) => (decision(g)?.options ?? []).map((o) => o.id);

describe('OP13-100 Jewelry Bonney: [Your Turn] [Once Per Turn] when I play a Character with a [Trigger], give up to 2 rested DON!!', () => {
  it('playing a Character with a [Trigger] asks how many (up to 2), then the target; the rested DON!! are moved', () => {
    const g = start();
    play(g, SPEED);
    need(g, 'choose', 'p1');
    expect(counts(g)).toEqual(['2', '1', '0']);
    giveCount(g, 2);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(don(g)).toMatchObject({ active: 8, rested: 0 });
  });

  it('the DON!! may go to one of my Characters instead (the played Character included)', () => {
    const g = start({ chars: [SC15.red3] });
    play(g, SPEED);
    giveCount(g, 2);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SC15.red3, SPEED, ID].sort());
    expect(choices(g)).toContain(g.leader('p1'));
    pickRaw(g, at(g, 'p1', 'characters', SC15.red3));
    expect(g.card(at(g, 'p1', 'characters', SC15.red3)).don).toBe(2);
    expect(g.card(g.leader('p1')).don).toBe(0);
  });

  it('only my own Leader and Characters can receive them', () => {
    const g = start({ p2: [SC15.red3] });
    play(g, SPEED);
    giveCount(g, 2);
    need(g, 'choose', 'p1');
    expect(choices(g)).not.toContain(g.leader('p2'));
    expect(choices(g)).not.toContain(at(g, 'p2', 'characters', SC15.red3));
  });

  it('"up to 2": giving 1 leaves the other rested DON!! rested', () => {
    const g = start();
    play(g, SPEED);
    giveCount(g, 1);
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 8, rested: 1 });
  });

  it('"up to 2": giving none is legal and moves nothing', () => {
    const g = start();
    play(g, SPEED);
    giveCount(g, 0);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g)).toMatchObject({ active: 8, rested: 2 });
  });

  it('only rested DON!! can be given: with 1 rested DON!! (a cost 1 Character) the offer tops out at 1', () => {
    const g = start({ hand: [HITETSU] });
    play(g, HITETSU);
    if (kind(g) === 'choose' && counts(g).length) {
      expect(counts(g)).toEqual(['1', '0']);
      giveCount(g, 1);
    }
    need(g, 'choose', 'p1');
    pickRaw(g, g.leader('p1'));
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 9, rested: 0 });
  });

  it('a Character without a [Trigger] does not activate it: no prompt', () => {
    const g = start();
    play(g, GENBO);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g)).toMatchObject({ active: 7, rested: 3 });
  });

  it('[Once Per Turn]: a second Character with a [Trigger] in the same turn gives nothing', () => {
    const g = start();
    play(g, SPEED);
    giveCount(g, 1);
    pickRaw(g, g.leader('p1'));
    play(g, RABIYAN);
    expect(atMain(g)).toBe(true);
    expect(g.card(g.leader('p1')).don).toBe(1);
    expect(don(g)).toMatchObject({ active: 6, rested: 3 });
  });

  it('it also fires for a Character played by another effect (Stussy OP13-110 plays Speed)', () => {
    const g = start({ hand: ['OP13-110', SPEED] });
    play(g, 'OP13-110');
    // Stussy has no [Trigger] of its own; its [On Play] plays Speed, a Character with a [Trigger].
    for (let i = 0; i < 4 && kind(g) === 'choose' && counts(g).length === 0; i++) {
      pickRaw(g, at(g, 'p1', 'hand', SPEED));
    }
    need(g, 'choose', 'p1');
    expect(counts(g)).toContain('2');
    giveCount(g, 2);
    pickRaw(g, g.leader('p1'));
    expect(g.card(g.leader('p1')).don).toBe(2);
    expect(trash(g)).toEqual([]);
  });

  it('[Your Turn] only: a Character with a [Trigger] played from my Life on the opponent’s turn gives nothing', () => {
    const g = theirs(
      ID,
      { life: [S13.daifuku, BLUE, BLUE, BLUE], costArea: { active: 0, rested: 2 } },
      {},
    );
    hitLeader(g);
    activateTrigger(g);
    expect(chars(g)).toEqual([S13.daifuku]);
    expect(kind(g)).toBe('main');
    expect(g.card(g.leader('p1')).don).toBe(0);
    expect(don(g)).toMatchObject({ active: 0, rested: 2 });
  });
});
