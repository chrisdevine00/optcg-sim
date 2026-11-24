/**
 * OP14-021 Issho (Character, cost 6, 7000, Counter +1000, {Navy}/{Dressrosa}).
 *
 * Card text: "[Your Turn] When this Character becomes rested, you may add 1 card from the top of your
 * Life cards to your hand. If you do, up to 1 of your opponent's rested Characters or Stages will
 * not become active in your opponent's next Refresh Phase."
 *
 * Rules: Characters rest when they attack, so attacking with Issho is "becoming rested"
 * (open question M6b-Q30 asks whether the engine reads it so; the tests rely on attacking, the
 * common case, and use an opposing effect for the [Your Turn] gate). A Life card added to hand by
 * an effect does not activate its [Trigger] (rules-digest 104). "If you do" gates the second
 * sentence on adding the card. "Up to 1" may be none. The Refresh Phase sets rested cards active
 * (CR 6-2-4); the lock covers only the next one.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  BLUE,
  chr,
  endTurn,
  fill,
  hand,
  kind,
  LD14,
  lifeCards,
  mine,
  need,
  no,
  none,
  noDefence,
  offeredIds,
  payDonStrict,
  pickInst,
  playRaw,
  S14,
  swing,
  theirs,
  unusable,
  yes,
} from './kit-op14a.ts';

const ISSHO = 'OP14-021';
/** OP01-104 Speed: purple Character with a [Trigger] "Play this card". */
const SPEED = 'OP01-104';
/** OP17-038: green Event, cost 0, [Main] You may rest 4 of your cards: Rest up to 1 of your opponent's Characters. */
const REST_EVENT = 'OP17-038';

function board(life: string[] = [S14.alvida, BLUE, BLUE, BLUE], p2spec = {}) {
  return mine(
    LD14.luffy,
    { life, characters: [ISSHO] },
    {
      characters: [{ card: S14.marco, rested: true }, { card: S14.sai, rested: true }, S14.kingdew],
      ...p2spec,
    },
  );
}

/** Attack with Issho and accept the "add Life to hand" question. */
function attackAndAccept(g: ReturnType<typeof board>) {
  swing(g, ISSHO);
  need(g, 'optional', 'p1');
  yes(g, 'p1');
}

describe('OP14-021 Issho: [Your Turn] when rested, add top Life to hand; a rested opposing card stays rested', () => {
  it('printed values: cost 6, 7000, Counter +1000', () => {
    const g = board();
    const c = at(g, 'p1', 'characters', ISSHO);
    expect(g.card(c).cost).toBe(6);
    expect(g.power(c)).toBe(7000);
    expect(g.card(c).counter).toBe(1000);
  });

  it('attacking rests Issho and asks whether to add the top Life card; accepting moves exactly that card to hand', () => {
    const g = board([S14.alvida, BLUE, BLUE, BLUE]);
    swing(g, ISSHO);
    need(g, 'optional', 'p1');
    yes(g, 'p1');
    expect(g.life('p1')).toBe(3);
    expect(hand(g)).toEqual([S14.alvida]);
    expect(lifeCards(g)).toEqual([BLUE, BLUE, BLUE]);
  });

  it('offers exactly the opposing RESTED Characters (not active ones, not my own)', () => {
    const g = board();
    attackAndAccept(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.marco, S14.sai].sort());
  });

  it('offers a rested opposing Stage as well', () => {
    const g = board(undefined, { stage: { card: S14.stage, rested: true } });
    attackAndAccept(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([S14.marco, S14.sai, S14.stage].sort());
  });

  it("the chosen card stays rested in the opponent's next Refresh Phase; the unchosen rested Character becomes active", () => {
    const g = board();
    attackAndAccept(g);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(false);
  });

  it('a chosen rested Stage also stays rested', () => {
    const g = board(undefined, { stage: { card: S14.stage, rested: true } });
    attackAndAccept(g);
    pickInst(g, [g.find('p2', 'stage', S14.stage)]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(g.find('p2', 'stage', S14.stage)).rested).toBe(true);
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it('it lasts for one Refresh Phase only: the chosen card is active again one turn cycle later', () => {
    const g = board();
    attackAndAccept(g);
    pickInst(g, [chr(g, 'p2', S14.marco)]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    endTurn(g);
    need(g, 'main', 'p1');
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it('"up to 1": choosing nothing still adds the Life card, and every rested card refreshes normally', () => {
    const g = board();
    attackAndAccept(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(g.life('p1')).toBe(3);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
    expect(g.card(chr(g, 'p2', S14.sai)).rested).toBe(false);
  });

  it('"you may": declining adds no Life card and asks for no target', () => {
    const g = board();
    swing(g, ISSHO);
    no(g, 'p1');
    expect(g.life('p1')).toBe(4);
    expect(hand(g)).toEqual([]);
    expect(kind(g)).toBe('block');
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it('with 0 Life cards the Life card cannot be added: the effect is not usable and nothing is locked', () => {
    const g = board([]);
    swing(g, ISSHO);
    unusable(g, 'p1');
    expect(kind(g)).toBe('block');
    expect(hand(g)).toEqual([]);
    noDefence(g);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(g.card(chr(g, 'p2', S14.marco)).rested).toBe(false);
  });

  it('a Life card with [Trigger] added to hand this way does not activate its [Trigger]', () => {
    const g = board([SPEED, BLUE, BLUE, BLUE]);
    attackAndAccept(g);
    expect(kind(g)).toBe('choose');
    expect(hand(g)).toEqual([SPEED]);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ISSHO]);
  });
});

describe('OP14-021 Issho: the effect is for my own turn only ([Your Turn])', () => {
  it('when the opponent rests Issho on their turn nothing is asked and my Life is untouched', () => {
    const g = theirs(
      LD14.luffy,
      { life: fill(BLUE, 4), characters: [ISSHO] },
      { hand: [REST_EVENT], characters: [S14.marco] },
    );
    playRaw(g, REST_EVENT);
    yes(g, 'p2');
    payDonStrict(g, 4);
    need(g, 'choose', 'p2');
    pickInst(g, [at(g, 'p1', 'characters', ISSHO)]);
    expect(g.card(at(g, 'p1', 'characters', ISSHO)).rested).toBe(true);
    expect(g.life('p1')).toBe(4);
    expect(kind(g)).toBe('main');
  });
});
