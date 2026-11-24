/** EB03-024 Nefeltari Vivi. */
import { describe, expect, it } from 'vitest';
import { expectDecision, none, pick, play, V } from './helpers.ts';
import { ALA2, ALA5, ALA6, canPick, cardsIn, mk, SHC5, SHC6 } from './helpers-eb03g1.ts';

const ID = 'EB03-024';
const start = () => mk({ hand: [ID, ALA2, ALA5, ALA6, SHC5, SHC6, V.c1] });
const canPlay = (g: ReturnType<typeof start>, card: string) =>
  g.legal().some((a) => a.type === 'playCard' && a.card === g.find('p1', 'hand', card));

describe('EB03-024 Nefeltari Vivi', () => {
  it('[On Play]: plays an {Alabasta} or {Straw Hat Crew} Character with a cost of 5 or less from hand', () => {
    const g = start();
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p1', 'hand', ALA2))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ALA5))).toBe(true); // cost 5 boundary
    expect(canPick(g, g.find('p1', 'hand', SHC5))).toBe(true);
    expect(canPick(g, g.find('p1', 'hand', ALA6))).toBe(false); // cost 6
    expect(canPick(g, g.find('p1', 'hand', SHC6))).toBe(false);
    expect(canPick(g, g.find('p1', 'hand', V.c1))).toBe(false); // wrong type
    pick(g, [g.find('p1', 'hand', SHC5)]);
    expect(cardsIn(g, 'p1', 'characters').sort()).toEqual([ID, SHC5].sort());
  });

  it('then you cannot play any Character cards during this turn', () => {
    const g = start();
    play(g, ID);
    pick(g, [g.find('p1', 'hand', ALA5)]);
    expectDecision(g, 'main', 'p1');
    expect(canPlay(g, ALA2)).toBe(false);
    expect(canPlay(g, V.c1)).toBe(false);
  });

  it('"Then" is not "If you do": the restriction applies when nothing was played', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(canPlay(g, V.c1)).toBe(false);
    expect(cardsIn(g, 'p1', 'characters')).toEqual([ID]);
  });

  it('the restriction ends with the turn', () => {
    const g = start();
    play(g, ID);
    none(g);
    g.act({ type: 'endTurn' });
    g.act({ type: 'endTurn' });
    expect(canPlay(g, V.c1)).toBe(true);
  });

  it('no eligible card in hand: the pick is asked at max 0 and the restriction still applies', () => {
    const g = mk({ hand: [ID, V.c1, ALA6] });
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
    none(g);
    expect(canPlay(g, V.c1)).toBe(false);
  });

  it('[Blocker]: printed', () => {
    const g = mk({ characters: [ID] }, { characters: [V.c3] }, { turn: 4, activePlayer: 'p2' });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c3), target: g.leader('p1') });
    expect(
      g.legal().some((a) => a.type === 'block' && a.blocker === g.find('p1', 'characters', ID)),
    ).toBe(true);
  });
});
