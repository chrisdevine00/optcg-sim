/** OP13-104 Kouzuki Hiyori. */
import { describe, expect, it } from 'vitest';
import { validateScript } from '@optcg/cards';
import { OP13_104 } from '../../../cards/effects/OP-13/OP13-104.ts';
import { accept, BLUE, decline, expectDecision, pick, PLAIN_PURPLE, V } from './helpers.ts';
import { canBlockWith, koByBattle, MULTI_LEADER, names, rep, theirs } from './helpers-op13g4.ts';

const ID = 'OP13-104';

const koed = (leader: string, hand: string[] = [V.c1]) =>
  koByBattle({ leader, hand, deck: [V.c2, ...rep(5, BLUE)], life: rep(3, BLUE) }, ID);

describe('OP13-104 Kouzuki Hiyori', () => {
  it('[On K.O.] trash 1: with a multicolored Leader, adds the top deck card to the top of Life', () => {
    const g = koed(MULTI_LEADER);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    accept(g);
    expect(names(g, 'p1', 'trash')).toContain(V.c1);
    expect(g.life('p1')).toBe(4);
    expect(g.zone('p1', 'life')[0]!.card).toBe(V.c2);
    expect(g.zone('p1', 'deck')).toHaveLength(5);
  });

  it('with a mono-coloured Leader the card is trashed but no Life is added', () => {
    const g = koed(PLAIN_PURPLE);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    expectDecision(g, 'main');
    expect(g.life('p1')).toBe(3);
    expect(names(g, 'p1', 'trash')).toContain(V.c1);
  });

  it('declining the optional trash does nothing', () => {
    const g = koed(MULTI_LEADER);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(names(g, 'p1', 'hand')).toEqual([V.c1]);
  });

  it('"up to 1": the Life add may be declined', () => {
    const g = koed(MULTI_LEADER);
    accept(g);
    pick(g, [g.find('p1', 'hand', V.c1)]);
    decline(g);
    expect(g.life('p1')).toBe(3);
  });

  it('has printed [Blocker]', () => {
    const g = theirs({ leader: PLAIN_PURPLE, characters: [ID] }, { characters: [V.c7] });
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', V.c7), target: g.leader('p1') });
    expect(canBlockWith(g, g.find('p1', 'characters', ID))).toBe(true);
  });

  // OP13-R8: the runtime always adds a deck-top card to the top of Life, so the position in the
  // script is checked here: "to the top of your Life cards" is `top`, and `bottom` is not a legal
  // script for this move (the validator rejects it).
  it('the Life add is to the top: the script says top and a bottom variant fails validation', () => {
    expect(validateScript(OP13_104)).toEqual([]);
    expect(JSON.stringify(OP13_104.abilities)).toContain('"zone":"life","position":"top"');
    const bottom = JSON.parse(
      JSON.stringify(OP13_104).replace('"position":"top"', '"position":"bottom"'),
    );
    expect(validateScript(bottom).length).toBeGreaterThan(0);
  });
});
