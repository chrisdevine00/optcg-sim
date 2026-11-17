/**
 * OP14-104 Gecko Moria (Character, Yellow, cost 8, 10000; The Seven Warlords of the Sea / Thriller Bark Pirates).
 *
 * Card text:
 *   "[On Play] Select up to 1 {Thriller Bark Pirates} type Character with a cost of 4 or less from
 *    your trash and play it or add it to the top of your Life cards face-up.
 *    [Trigger] Play up to 1 Character card with a cost of 4 or less from your trash."
 *
 * Rules: CR 8-4-4-1 "up to 1"; a Life card added by an effect is face-down unless the effect says
 * face-up (CR 3-10-2-1); playing from trash pays no cost (CR 3-7-3-1 style: "play" by effect).
 * Trash scenery: OP02-054 Gecko Moria (TBP, cost 4), OP06-094 Lola (TBP, cost 4), OP14-101 Oars (TBP,
 * cost 8), OP01-023 Marco (not TBP, cost 3), OP01-018 Hajrudin (cost 4), OP02-006 Kingdew (cost 5).
 */
import { describe, expect, it } from 'vitest';
import type { PlayerSpec } from '@optcg/engine';
import {
  activateTrigger,
  BLUE,
  choiceCards,
  choose,
  chooseNone,
  hitLeader,
  isLegal,
  kind,
  LD,
  LEAD,
  myTurn,
  outcomes,
  playFromHand,
  RED,
  rep,
  side,
  sorted,
  sortedIds,
  theirTurn,
  V,
  VAN,
  zoneCards,
  act,
} from './kit-d.ts';
import type { TestGame } from '../../../fixtures/index.ts';

const MORIA = 'OP14-104';

function game(p1: Partial<PlayerSpec> = {}) {
  return myTurn(
    side(LD.navy, BLUE, {
      hand: [MORIA],
      costArea: { active: 8, rested: 0 },
      trash: [V.moria4, V.lola, V.oars, VAN.marco],
      ...p1,
    }),
    side(LEAD.luffy, RED),
  );
}

const fp = (x: TestGame) => {
  const life = x.zone('p1', 'life');
  return [
    sorted(zoneCards(x, 'p1', 'characters')).join('+'),
    `life${life.length}`,
    life.length ? `${life[0]!.card}:${life[0]!.faceUp ? 'up' : 'down'}` : '-',
    sorted(zoneCards(x, 'p1', 'trash')).join('+'),
  ].join('|');
};

describe('OP14-104 Gecko Moria [On Play]: a Thriller Bark Pirates Character (cost 4 or less) from trash', () => {
  it('candidates: only {Thriller Bark Pirates} Characters with cost 4 or less in YOUR trash', () => {
    const g = game();
    playFromHand(g, MORIA);
    expect(choiceCards(g)).toEqual([V.lola, V.moria4].sort());
  });

  it('the opponent’s trash is not a source', () => {
    const h = myTurn(
      side(LD.navy, BLUE, { hand: [MORIA], costArea: { active: 8, rested: 0 } }),
      side(LEAD.luffy, RED, { trash: [V.lola] }),
    );
    playFromHand(h, MORIA);
    expect(kind(h)).toBe('main');
  });

  it('both ways are reachable: play it, or add it to the top of Life FACE-UP; nothing else', () => {
    const g = game();
    playFromHand(g, MORIA);
    const ends = outcomes(g, 'p1', fp, 12);
    const playedLola = `${[MORIA, V.lola].sort().join('+')}|life4|`;
    const lifeLola = `${MORIA}|life5|${V.lola}:up|`;
    const startsWith = (p: string) => [...ends].some((e) => e.startsWith(p));
    expect(startsWith(playedLola)).toBe(true);
    expect(startsWith(lifeLola)).toBe(true);
    // And the same for the other legal card, and "nothing".
    expect(startsWith(`${[MORIA, V.moria4].sort().join('+')}|life4|`)).toBe(true);
    expect(startsWith(`${MORIA}|life4|`)).toBe(true);
    // Never a card that is not a legal candidate.
    for (const e of ends) {
      expect(e.split('|')[0]).not.toContain(V.oars);
      expect(e.split('|')[0]).not.toContain(VAN.marco);
    }
    // A card placed in Life is never face-down.
    for (const e of ends) if (e.includes('|life5|')) expect(e).toMatch(/:up\|/);
  });

  it('CR 8-4-4-1: choosing nothing leaves the trash as it was', () => {
    const g = game();
    playFromHand(g, MORIA);
    chooseNone(g);
    expect(sortedIds(g, 'p1', 'trash')).toEqual([V.lola, V.moria4, V.oars, VAN.marco].sort());
    expect(g.life('p1')).toBe(4);
  });

  it('with no eligible card in the trash nothing happens and nothing is asked', () => {
    const g = game({ trash: [V.oars, VAN.marco] });
    playFromHand(g, MORIA);
    expect(kind(g)).toBe('main');
    expect(g.life('p1')).toBe(4);
  });

  it('cost 8 is paid: with 7 DON!! it cannot be played', () => {
    const g = game({ costArea: { active: 7, rested: 0 } });
    expect(isLegal(g, { type: 'playCard', card: g.find('p1', 'hand', MORIA) })).toBe(false);
    void act;
  });
});

describe('OP14-104 Gecko Moria [Trigger]: play up to 1 Character with cost 4 or less from the trash', () => {
  function trig(trash: string[]) {
    const g = theirTurn(
      side(LD.navy, BLUE, { life: [MORIA, ...rep(BLUE, 3)], trash }),
      side(LEAD.luffy, RED),
    );
    hitLeader(g);
    activateTrigger(g);
    return g;
  }

  it('any Character with cost 4 or less is a candidate (not only Thriller Bark); cost 5+ and non-Characters are not', () => {
    const g = trig([VAN.marco, VAN.hajrudin, VAN.kingdew, V.oars]);
    expect(choiceCards(g)).toEqual([VAN.hajrudin, VAN.marco].sort());
  });

  it('the chosen Character is played (no cost) and the Trigger card is trashed', () => {
    const g = trig([VAN.marco, VAN.kingdew]);
    choose(g, [g.find('p1', 'trash', VAN.marco)]);
    expect(sortedIds(g, 'p1', 'characters')).toEqual([VAN.marco]);
    expect(sortedIds(g, 'p1', 'trash')).toContain(MORIA);
  });

  it('CR 8-4-4-1: up to 1 may be nothing', () => {
    const g = trig([VAN.marco]);
    chooseNone(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });
});
