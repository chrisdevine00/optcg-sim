/**
 * EB05-060 Take Care of Lilith!!! (Event, Yellow, cost 1, {Scientist}/{Egghead}).
 *
 * Card text: "[Main] You may trash 1 of your {Egghead} type Characters with a cost of 5 or more: Add up
 * to 1 card from the top of your deck to the top of your Life cards.
 * [Counter] You may turn 1 card from the top of your Life cards face-up: Up to 1 of your Leader or
 * Characters gains +4000 power during this battle."
 *
 * Rules: CR 8-3-1-3/-4 (an optional cost: unpayable or skipped means no effect), RL-15 (trashing is
 * not a K.O.), CR 1-3-2-1 (turning a face-up card face-up changes nothing, so it cannot pay), CR
 * 8-4-4-1 ("up to"), RL-08 (battle boost ends with the battle).
 */
import { describe, expect, it } from 'vitest';
import { attack, passBlock, passCounter } from '../../helpers.ts';
import { accept } from '../kit.ts';
import {
  BLUE,
  beginUse,
  CH,
  chars,
  choiceCards,
  counterEvent,
  deck,
  fill,
  kind,
  LD,
  mainEvent,
  mine,
  outcomes,
  RED,
  side,
  theirTurn,
  trash,
} from './kit-b.ts';

const ID = 'EB05-060';
const DECK = [CH.thatch, ...fill(BLUE, 14)];

function main(own: string[], use = true, pick: string | null = null) {
  const g = mine(LD.vegapunk, { hand: [ID], characters: own, deck: DECK, life: fill(RED, 2) });
  const sacrifice = pick ? [g.find('p1', 'characters', pick)] : [];
  mainEvent(g, g.find('p1', 'hand', ID), { use: [use], cost: sacrifice });
  return g;
}

describe('EB05-060 Take Care of Lilith!!! [Main]: trash an {Egghead} Character (cost 5+): add the top deck card to the top of my Life', () => {
  it('trashing Shaka (cost 5, {Egghead}) adds the top deck card to the top of Life face-down', () => {
    const g = main([CH.shaka], true, CH.shaka);
    expect(chars(g)).toEqual([]);
    expect(trash(g).sort()).toEqual([ID, CH.shaka].sort());
    expect(g.life('p1')).toBe(3);
    expect(g.zone('p1', 'life')[0]!.card).toBe(CH.thatch);
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(deck(g)).toHaveLength(14);
  });

  it('only {Egghead} Characters with cost 5 or more can pay: Vega Force 01 (cost 4) and Kingdew (cost 5, not Egghead) cannot', () => {
    const g = mine(LD.vegapunk, {
      hand: [ID],
      characters: [CH.shaka, CH.vegaForce, CH.kingdew],
      deck: DECK,
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    beginUse(g);
    // Shaka is the only legal payment, so the engine may pay it itself.
    if (kind(g) === 'choose') expect(choiceCards(g)).toEqual([CH.shaka]);
    else expect(g.zone('p1', 'characters').map((c) => c.card)).not.toContain(CH.shaka);
  });

  it('CR 8-3-1-3: with only a cost-4 {Egghead} Character the cost cannot be paid: no Life added, nothing trashed', () => {
    const g = main([CH.vegaForce, CH.kingdew]);
    expect(g.life('p1')).toBe(2);
    expect(chars(g)).toEqual([CH.vegaForce, CH.kingdew].sort());
    expect(deck(g)).toHaveLength(15);
  });

  it('declining the optional cost: nothing is trashed and no Life is added', () => {
    const g = main([CH.shaka], false);
    expect(chars(g)).toEqual([CH.shaka]);
    expect(g.life('p1')).toBe(2);
  });

  // DISAGREEMENT B-2, settled by review EB05-R4: the engine does ask "add up to 1"; the test kit's
  // beginUse accepted that prompt too. Accept only the cost here and explore the rest.
  it('"up to 1": after paying, adding no card is allowed (the Character is still trashed)', () => {
    const g = mine(LD.vegapunk, {
      hand: [ID],
      characters: [CH.shaka],
      deck: DECK,
      life: fill(RED, 2),
    });
    g.act({ type: 'playCard', card: g.find('p1', 'hand', ID) });
    accept(g); // the optional cost only; the effect's own prompt is explored below
    const lives = outcomes(g, 'p1', (x) => `${x.zone('p1', 'characters').length}/${x.life('p1')}`);
    expect(lives.has('0/2')).toBe(true);
    expect(lives.has('0/3')).toBe(true);
  });

  it('the cost is a trash, not a K.O.: Shaka goes to the trash from the field', () => {
    const g = main([CH.shaka], true, CH.shaka);
    expect(trash(g)).toContain(CH.shaka);
  });

  it('exactly 1 card is added to Life, not 2', () => {
    const g = main([CH.shaka, 'OP13-101'], true, CH.shaka);
    expect(g.life('p1')).toBe(3);
  });
});

describe('EB05-060 Take Care of Lilith!!! [Counter]: turn my top Life card face-up: Leader or Character +4000 during this battle', () => {
  function defending(life: { card: string; faceUp: boolean }[], own: string[] = []) {
    const g = theirTurn(
      side(LD.shc, BLUE, { hand: [ID], life, characters: own, costArea: { active: 1, rested: 0 } }),
      side(LD.shc, RED, { characters: [CH.kingdew] }),
    );
    attack(g, g.find('p2', 'characters', CH.kingdew), g.leader('p1'));
    passBlock(g);
    return g;
  }
  const lives = (n: number, faceUp = false) =>
    Array.from({ length: n }, () => ({ card: BLUE, faceUp }));

  it('turns the top Life card face-up and gives the Leader +4000 (9000 beats a 7000 attacker); Life count is unchanged', () => {
    const g = defending(lives(4));
    counterEvent(g, g.find('p1', 'hand', ID), { picks: [[g.leader('p1')]] });
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(true);
    expect(g.zone('p1', 'life').filter((c) => c.faceUp)).toHaveLength(1);
    expect(g.power(g.leader('p1'))).toBe(9000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('a Character may take the +4000', () => {
    const g = defending(lives(4), [CH.sai]);
    const sai = g.find('p1', 'characters', CH.sai);
    counterEvent(g, g.find('p1', 'hand', ID), { picks: [[sai]] });
    expect(g.power(sai)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('CR 1-3-2-1: a top Life card that is already face-up cannot be turned face-up, so the cost fails: no boost', () => {
    const g = defending([{ card: BLUE, faceUp: true }, ...lives(3)]);
    counterEvent(g, g.find('p1', 'hand', ID), { picks: [[g.leader('p1')]] });
    expect(g.power(g.leader('p1'))).toBe(5000);
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('declining the optional cost: the Life card stays face-down and there is no boost', () => {
    const g = defending(lives(4));
    counterEvent(g, g.find('p1', 'hand', ID), { use: [false] });
    expect(g.zone('p1', 'life')[0]!.faceUp).toBe(false);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('only the TOP card is turned: the second card stays face-down', () => {
    const g = defending(lives(4));
    counterEvent(g, g.find('p1', 'hand', ID), { picks: [[g.leader('p1')]] });
    expect(g.zone('p1', 'life')[1]!.faceUp).toBe(false);
  });
});
