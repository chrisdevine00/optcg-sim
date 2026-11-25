/**
 * ST16-002 Gordon (Character, Green, cost 2, 0 power, Counter +1000, {FILM}).
 *
 * Card text: "[Blocker] [On Your Opponent's Attack] You may trash any number of "Music" type cards from
 * your hand. Your Leader or 1 of your Characters gains +1000 power during this battle for every
 * card trashed."
 *
 * Rules: [Blocker] (CR 10-1-4): after an attack is declared an active Blocker may be rested to
 * become the new target; [On Your Opponent's Attack] fires when the opponent's attack is declared,
 * whatever it targets, before the Block Step; "any number" includes 0; only {Music} cards may be
 * trashed; the hand is hidden, so the "you may trash" is asked even with no {Music} card in it;
 * "during this battle" ends with the battle; the attacker wins on equal power (CR 7-1-4).
 */
import { describe, expect, it } from 'vitest';
import { act, decision } from '../../helpers.ts';
import {
  at,
  attack,
  blockers,
  canFinish,
  choices,
  hand,
  kind,
  kw,
  LW,
  mayChooseNone,
  mine,
  need,
  none,
  offeredIds,
  passBlock,
  pickCards,
  pickInst,
  sorted,
  theirs,
  trash,
  V13,
  W6,
  snap,
} from './kit-w6b.ts';

const GORDON = 'ST16-002';
const MUSIC = [W6.music1, W6.music2, W6.music3];
const FILL = 'OP02-060';

/** p2's turn: p1 has Gordon (and `chars`), the given hand and Leader ST01-001 (5000); p2 has two 6000 attackers. */
function defend(
  o: { hand?: string[]; chars?: (string | { card: string; rested: boolean })[] } = {},
) {
  return theirs(
    LW.luffy,
    { characters: [GORDON, ...(o.chars ?? [])], hand: o.hand ?? MUSIC },
    { characters: [V13.hajrudin, V13.hajrudin] },
  );
}

type G = ReturnType<typeof defend>;

const hit = (g: G, target: string, nth = 0) =>
  attack(g, at(g, 'p2', 'characters', V13.hajrudin, nth), target);

/** Answer the "trash any number of Music cards" prompt with these cards. */
function trashMusic(g: G, cards: string[]) {
  need(g, 'choose', 'p1');
  if (cards.length) pickCards(g, cards);
  else none(g);
}

/** Answer the "Leader or 1 of your Characters" pick with this instance. */
function boost(g: G, target: string) {
  need(g, 'choose', 'p1');
  pickInst(g, [target]);
}

describe("ST16-002 Gordon: [Blocker]; [On Your Opponent's Attack] trash any number of {Music} cards: my Leader or a Character gets +1000 per card this battle", () => {
  it('printed values: cost 2, 0 power, Counter +1000, [Blocker]', () => {
    const g = defend();
    const c = g.card(at(g, 'p1', 'characters', GORDON));
    expect(c.cost).toBe(2);
    expect(g.power(c.instance)).toBe(0);
    expect(c.counter).toBe(1000);
    expect(kw(g, c.instance)).toContain('Blocker');
  });

  it('their attack offers only the {Music} cards of my hand, up to all of them', () => {
    const g = defend({ hand: [...MUSIC, V13.marco, W6.beamSword] });
    hit(g, g.leader('p1'));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([...MUSIC].sort());
    expect(decision(g)?.max).toBe(3);
    expect(mayChooseNone(g)).toBe(true);
  });

  it('trashing 2 {Music} cards: my Leader gets +2000 this battle and survives a 6000 attack (7000 vs 6000)', () => {
    const g = defend();
    hit(g, g.leader('p1'));
    trashMusic(g, [W6.music1, W6.music2]);
    boost(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(7000);
    expect(trash(g)).toEqual([W6.music1, W6.music2].sort());
    expect(hand(g)).toEqual([W6.music3]);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.life('p1')).toBe(4);
  });

  it('+1000 for every card trashed: 1 card gives only 6000, which a 6000 attacker still beats (the attacker wins ties)', () => {
    const g = defend();
    hit(g, g.leader('p1'));
    trashMusic(g, [W6.music1]);
    boost(g, g.leader('p1'));
    expect(g.power(g.leader('p1'))).toBe(6000);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    // The Life card goes to my hand (a [Trigger] question may come first for a card without one: none).
    while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
    expect(g.life('p1')).toBe(3);
  });

  it('the boost may go on one of my Characters instead: a rested Character attacked survives', () => {
    const g = defend({ chars: [{ card: V13.sai, rested: true }] });
    const sai = at(g, 'p1', 'characters', V13.sai);
    hit(g, sai);
    trashMusic(g, MUSIC);
    need(g, 'choose', 'p1');
    expect(choices(g)).toContain(sai);
    expect(choices(g)).toContain(g.leader('p1'));
    pickInst(g, [sai]);
    expect(g.power(sai)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    expect(g.zone('p1', 'characters').map((c) => c.card)).toContain(V13.sai);
  });

  it('"any number" includes 0: trashing nothing boosts nothing', () => {
    const g = defend();
    hit(g, g.leader('p1'));
    trashMusic(g, []);
    if (kind(g) === 'choose') {
      // A "which one gets +0" pick, if the engine asks it, ends with the same result.
      if (canFinish(g)) none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(hand(g)).toEqual([...MUSIC].sort());
    expect(trash(g)).toEqual([]);
  });

  it('with no {Music} card in my hand the question is still asked (the hand is hidden), with nothing to pick', () => {
    const g = defend({ hand: [V13.marco, FILL] });
    hit(g, g.leader('p1'));
    expect(kind(g), snap(g)).toBe('choose');
    expect(decision(g)?.player).toBe('p1');
    expect(choices(g)).toEqual([]);
    none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(sorted(g, 'p1', 'hand')).toEqual([FILL, V13.marco].sort());
  });

  it('the boost lasts this battle only: a second attack finds my Leader at 5000', () => {
    const g = defend({ hand: [W6.music1] });
    hit(g, g.leader('p1'), 0);
    trashMusic(g, [W6.music1]);
    boost(g, g.leader('p1'));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
    expect(kind(g)).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('[Blocker]: an active Gordon can block their attack and becomes the target', () => {
    const g = defend({ hand: [] });
    hit(g, g.leader('p1'));
    if (kind(g) === 'choose') none(g);
    expect(kind(g)).toBe('block');
    expect(blockers(g)).toEqual([at(g, 'p1', 'characters', GORDON)]);
    act(g, { type: 'block', blocker: at(g, 'p1', 'characters', GORDON) });
    expect(g.card(at(g, 'p1', 'characters', GORDON)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
  });

  it('it fires on every attack of theirs, not only the first, and not on my own attacks', () => {
    const g = defend({ hand: [W6.music1, W6.music2] });
    hit(g, g.leader('p1'), 0);
    trashMusic(g, []);
    if (kind(g) === 'choose' && canFinish(g)) none(g);
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    while (kind(g) === 'trigger') act(g, { type: 'trigger', activate: false });
    hit(g, g.leader('p1'), 1);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W6.music1, W6.music2].sort());

    // My own attack: no prompt.
    const mineG = mine(LW.luffy, { characters: [GORDON, V13.hajrudin], hand: MUSIC });
    attack(mineG, at(mineG, 'p1', 'characters', V13.hajrudin), mineG.leader('p2'));
    expect(kind(mineG)).toBe('block');
    expect(decision(mineG)?.player).toBe('p2');
  });
});
