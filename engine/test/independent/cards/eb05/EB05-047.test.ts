/**
 * EB05-047 Ripley (Character, Black, cost 4, 4000, Counter +2000, {Giant}/{Elbaph}).
 *
 * Card text: "This Character gains +12 cost.
 * [On Play] You may trash 1 card from your hand: Play up to 1 Character card with a cost of 2 or
 * less from your trash."
 *
 * Rules: the first sentence is a permanent effect (CR 8-1-3-3) applied while Ripley is on the
 * field; the printed cost 4 is what it costs to play. The cost of the [On Play] (trash 1 from
 * hand) is paid before the effect resolves, so the trashed card is in the trash when the Character
 * is chosen (CR 8-4-1). "Up to 1" may choose 0 (CR 8-4-4-1). RD 112 (an [On Play] cost may be
 * declined). Cards "played" by an effect cost nothing.
 */
import { describe, expect, it } from 'vitest';
import {
  accept,
  BLUE,
  CH,
  chars,
  choiceCards,
  chooseCards,
  choose,
  don,
  drive,
  EV,
  fill,
  hand,
  kind,
  LD,
  mine,
  play,
  playCard,
  trash,
} from './kit-b.ts';

const ID = 'EB05-047';

function go(o: { hand?: string[]; trash?: string[] } = {}) {
  const g = mine(LD.neutral, {
    hand: [ID, ...(o.hand ?? [CH.mohji])],
    trash: o.trash ?? [CH.sai],
    deck: fill(BLUE, 15),
  });
  playCard(g, ID);
  return g;
}

describe('EB05-047 Ripley: this Character gains +12 cost', () => {
  it('on the field its cost is 4 + 12 = 16', () => {
    const g = go();
    drive(g, 'p1', { use: [false] });
    expect(g.card(g.find('p1', 'characters', ID)).cost).toBe(16);
  });

  it('the printed cost 4 is what is paid to play it (4 DON!! rested, not 16)', () => {
    const g = go();
    drive(g, 'p1', { use: [false] });
    expect(don(g).rested).toBe(4);
  });

  it('a "cost of 6 or less" effect cannot pick Ripley (16): Gravity Blade offers Marco but not Ripley', () => {
    const g = mine(LD.navy, { hand: [EV.gravity], characters: [ID, CH.marco] });
    play(g, g.find('p1', 'hand', EV.gravity));
    expect(choiceCards(g)).toEqual([CH.marco]);
  });
});

/** Say yes to the optional cost and trash `card` from hand to pay it. */
function pay(g: ReturnType<typeof go>, card: string) {
  if (kind(g) === 'optional') accept(g);
  choose(g, [g.find('p1', 'hand', card)]);
}

describe('EB05-047 Ripley [On Play]: trash 1 from hand: play up to 1 Character (cost <= 2) from the trash', () => {
  it('the candidates are the Characters of cost <= 2 in the trash, including the card just paid', () => {
    const g = go();
    pay(g, CH.mohji);
    expect(kind(g)).toBe('choose');
    expect(choiceCards(g)).toEqual([CH.mohji, CH.sai].sort());
  });

  it('plays Sai: it leaves the trash and enters the field; the paid card stays in the trash', () => {
    const g = go();
    pay(g, CH.mohji);
    chooseCards(g, [CH.sai]);
    expect(chars(g)).toEqual([CH.sai, ID].sort());
    expect(trash(g)).toEqual([CH.mohji]);
    expect(hand(g)).toEqual([]);
  });

  it('the card trashed as the cost is itself a legal choice (cost is paid first)', () => {
    const g = go({ trash: [] });
    pay(g, CH.mohji);
    chooseCards(g, [CH.mohji]);
    expect(chars(g)).toEqual([CH.mohji, ID].sort());
    expect(trash(g)).toEqual([]);
  });

  it('boundary: a cost-3 Character in the trash is not a candidate, a cost-2 one is', () => {
    const g = go({ trash: [CH.marco, CH.sai], hand: [CH.komachiyo] });
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.komachiyo)], picks: [[]] });
    expect(trash(g)).toEqual([CH.marco, CH.sai, CH.komachiyo].sort());
    expect(chars(g)).toEqual([ID]);
  });

  it('only Character cards: an Event of cost 0 in the trash is not offered', () => {
    const g = go({ trash: ['EB05-040'], hand: [CH.marco] });
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.marco)] });
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toContain('EB05-040');
  });

  it('"up to 1": after paying, choosing no Character is allowed', () => {
    const g = go();
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.mohji)], picks: [[]] });
    expect(chars(g)).toEqual([ID]);
    expect(trash(g)).toHaveLength(2);
  });

  it('RD 112: declining the cost plays nothing and trashes nothing', () => {
    const g = go();
    drive(g, 'p1', { use: [false] });
    expect(hand(g)).toEqual([CH.mohji]);
    expect(trash(g)).toEqual([CH.sai]);
    expect(chars(g)).toEqual([ID]);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid, so nothing is played from the trash', () => {
    const g = go({ hand: [] });
    drive(g, 'p1', {});
    expect(trash(g)).toEqual([CH.sai]);
    expect(chars(g)).toEqual([ID]);
    expect(kind(g)).toBe('main');
  });

  it('the Character played from the trash costs no DON!! (still only the 4 for Ripley rested)', () => {
    const g = go({ trash: [CH.sai] });
    drive(g, 'p1', { cost: [g.find('p1', 'hand', CH.mohji)] });
    expect(don(g).rested).toBe(4);
  });
});
