/**
 * EB05-049 Special Hollow (Event, Black, cost 1, {Thriller Bark Pirates}).
 *
 * Card text: "[Main] You may K.O. 1 of your {Thriller Bark Pirates} type Characters: Give up to 1 of
 * your opponent's Characters -3 cost during this turn.
 * [Counter] You may K.O. 1 of your {Thriller Bark Pirates} type Characters: Up to 1 of your Leader
 * or Characters gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost that is skipped or cannot be paid: no effect), M6b-Q19 and
 * RL-15 (a K.O. paid as a cost is a K.O.: [On K.O.] fires), CR 1-3-6-2 (a cost below 0 is treated as
 * 0), RL-09 ("during this turn"), RL-08 ("during this battle"), CR 8-4-4-1.
 */
import { describe, expect, it } from 'vitest';
import { attack, endTurn, passBlock, passCounter } from '../../helpers.ts';
import {
  BLUE,
  beginUse,
  CH,
  choiceCards,
  choices,
  chooseIfAsked,
  decision,
  drive,
  EV,
  kind,
  LD,
  mainEvent,
  mine,
  RED,
  side,
  theirTurn,
  trash,
  useCounter,
} from './kit-b.ts';

const ID = EV.hollow;

function main(o: { own?: string[]; opp?: string[]; use?: boolean; target?: string | null } = {}) {
  const opp = o.opp ?? [CH.kingdew];
  const own = o.own ?? [CH.moria, CH.marco];
  const g = mine(LD.shc, { hand: [ID], characters: own }, { characters: opp });
  const tgt = o.target === null ? [] : [g.find('p2', 'characters', o.target ?? opp[0]!)];
  const sacrifice = own.includes(CH.moria) ? [g.find('p1', 'characters', CH.moria)] : [];
  mainEvent(g, g.find('p1', 'hand', ID), { use: [o.use ?? true], cost: sacrifice, picks: [tgt] });
  return g;
}

describe('EB05-049 Special Hollow [Main]: K.O. 1 {Thriller Bark Pirates}: an opposing Character gets -3 cost', () => {
  it('K.O.s my Gecko Moria and the chosen Character’s cost 5 becomes 2 this turn', () => {
    const g = main();
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).cost).toBe(2);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CH.marco]);
    expect(trash(g).sort()).toEqual([ID, CH.moria].sort());
  });

  it('CR 1-3-6-2: a cost of 2 reduced by 3 is treated as 0', () => {
    const g = main({ opp: [CH.sai] });
    expect(g.card(g.find('p2', 'characters', CH.sai)).cost).toBe(0);
  });

  it('only {Thriller Bark Pirates} Characters can pay: Marco is not a candidate, Moria and Lola are', () => {
    const g = mine(
      LD.shc,
      { hand: [ID], characters: [CH.moria, CH.lola, CH.marco] },
      { characters: [CH.kingdew] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    beginUse(g);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.moria, CH.lola].sort());
  });

  it('CR 8-3-1-3: with no {Thriller Bark Pirates} Character the cost cannot be paid: no cost change, Marco stays', () => {
    const g = main({ own: [CH.marco] });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).cost).toBe(5);
    expect(g.zone('p1', 'characters')).toHaveLength(1);
  });

  it('CR 8-3-1-4: declining the optional cost: nobody is K.O.’d and no cost changes', () => {
    const g = main({ use: false });
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).cost).toBe(5);
    expect(g.zone('p1', 'characters')).toHaveLength(2);
    expect(trash(g)).toEqual([ID]);
  });

  it('only the opposing Characters can be given -3 cost (not mine)', () => {
    const g = mine(
      LD.shc,
      { hand: [ID], characters: [CH.moria, CH.marco] },
      { characters: [CH.kingdew, CH.sai] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    beginUse(g); // Gecko Moria is the only {Thriller Bark Pirates}: the engine pays the pick itself
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.kingdew, CH.sai].sort());
  });

  it('"up to 1": the K.O. is paid but no Character need be chosen', () => {
    const g = main({ target: null });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CH.marco]);
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).cost).toBe(5);
  });

  it('RL-09: the -3 cost lasts only this turn (5 again on the opponent’s turn)', () => {
    const g = main();
    endTurn(g);
    expect(g.card(g.find('p2', 'characters', CH.kingdew)).cost).toBe(5);
  });

  it('M6b-Q19: the K.O. paid as a cost is a real K.O.: my Perona’s [On K.O.] fires after Hollow resolves', () => {
    const g = mine(
      LD.shc,
      { hand: [ID], characters: ['EB05-043', CH.marco] },
      { characters: [CH.kingdew] },
    );
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    beginUse(g);
    chooseIfAsked(g, [g.find('p2', 'characters', CH.kingdew)]);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(d?.source?.card).toBe('EB05-043');
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([CH.marco]);
  });
});

describe('EB05-049 Special Hollow [Counter]: K.O. 1 {Thriller Bark Pirates}: Leader or Character +4000 during this battle', () => {
  function defending(own: string[] = [CH.moria, CH.marco]) {
    const g = theirTurn(
      side(LD.shc, BLUE, { hand: [ID], characters: own, costArea: { active: 1, rested: 0 } }),
      side(LD.shc, RED, { characters: [CH.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', CH.kingdew), g.leader('p1'));
    passBlock(g);
    return g;
  }

  it('K.O.s Moria and gives the Leader +4000 (9000 beats a 7000 attacker); the boost ends with the battle', () => {
    const g = defending();
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    expect(trash(g)).toContain(CH.moria);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character may take the +4000 instead of the Leader', () => {
    const g = defending();
    const marco = g.find('p1', 'characters', CH.marco);
    useCounter(g, g.find('p1', 'hand', ID), marco);
    chooseIfAsked(g, [marco]);
    expect(g.power(marco)).toBe(9000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 8-3-1-3: with no {Thriller Bark Pirates} Character there is no boost and the 7000 attack connects', () => {
    const g = defending([CH.marco]);
    useCounter(g, g.find('p1', 'hand', ID), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    drive(g, 'p1', {});
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
    expect(choices(g)).toEqual([]);
  });
});
