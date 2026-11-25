/**
 * EB02-059 Without Your Help I Can't Become the King of the Pirates!!!! (Yellow Event, cost 4,
 * {Straw Hat Crew}).
 *
 * Card text: "[Counter] Up to 1 of your Leader or Character cards gains +1000 power during this battle.
 * Then, if you have 1 or less Life cards, play up to 1 of your yellow "Straw Hat Crew" type Character
 * cards or [Sanji] with a cost of 5 or less from your hand."
 *
 * Rules: [Counter] Events are used from the hand in the Counter Step and cost DON!! (CR 10-2-3); the
 * boost is for this battle only and goes to an own Leader or Character; "up to" may be 0; the second
 * half needs 1 or less Life (0 counts) when it resolves; the quoted type matches any type including
 * the text; an "up to" pick over the hand with a filter is asked even when nothing matches.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  canCounterNow,
  canFinish,
  chars,
  choices,
  decision,
  hand,
  kind,
  LE,
  need,
  none,
  offeredIds,
  passCounter,
  pickCards,
  SE,
  theirs,
  trash,
  activateCounter,
  orderFirst,
} from './kit-eb02b.ts';
import { ch } from './kit-eb02b.ts';

const EVENT = 'EB02-059';
/** ST29-005 Jinbe: Yellow, cost 6, 5000, {Fish-Man}/{Straw Hat Crew}/{Egghead}. Too expensive. */
const JINBE6 = 'ST29-005';

/** p2's Leader attacks p1's Leader; p1 (with the Event in hand) passes Block and stands at the Counter Step. */
function defend(o: { life?: number; hand?: string[]; chars?: string[]; active?: number } = {}) {
  const g = theirs(
    LE.luffy,
    {
      hand: [EVENT, ...(o.hand ?? [])],
      life: Array(o.life ?? 4).fill(SE.mohji),
      characters: o.chars ?? [],
      costArea: { active: o.active ?? 4, rested: 0 },
    },
    {},
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  if (kind(g) === 'block') act(g, { type: 'block', blocker: null });
  need(g, 'counter', 'p1');
  return g;
}

/** Use the Event and pick `target` for the boost when it is asked. */
function use(g: ReturnType<typeof defend>, target = g.leader('p1')) {
  activateCounter(g, g.find('p1', 'hand', EVENT));
  if (kind(g) === 'choose' && choices(g).includes(target)) act(g, { type: 'pick', choice: target });
  if (kind(g) === 'choose' && g.legal().some((a) => a.type === 'done') && decision(g)?.max !== 0) {
    // "up to 1" may stay open after the pick in some encodings.
    if (choices(g).length === 0) act(g, { type: 'done' });
  }
}

describe('EB02-059 Without Your Help...: [Counter] +1000 power to a Leader or Character', () => {
  it('can be used in the Counter Step with 4 active DON!! and costs 4', () => {
    const g = defend({ active: 4 });
    expect(canCounterNow(g, g.find('p1', 'hand', EVENT))).toBe(true);
    use(g);
    expect(trash(g)).toEqual([EVENT]);
    expect(g.zone('p1', 'hand').map((c) => c.card)).toEqual([]);
  });

  it('cannot be used with only 3 active DON!!', () => {
    const g = defend({ active: 3 });
    expect(canCounterNow(g, g.find('p1', 'hand', EVENT))).toBe(false);
  });

  it('+1000 on the Leader (5000 to 6000) beats the 5000 attack: no damage', () => {
    const g = defend();
    use(g);
    expect(g.power(g.leader('p1'))).toBe(6000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('without the Event the same 5000 attack on a 5000 Leader hits (boundary: equal power is a hit)', () => {
    const g = defend();
    passCounter(g);
    expect(g.life('p1')).toBe(3);
  });

  it('the boost lasts this battle only', () => {
    const g = defend();
    use(g);
    passCounter(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("the target may be an own Character, never the opponent's Leader or Characters", () => {
    const g = defend({ chars: [SE.sai] });
    activateCounter(g, g.find('p1', 'hand', EVENT));
    need(g, 'choose', 'p1');
    expect(choices(g).sort()).toEqual([g.leader('p1'), ch(g, 'p1', SE.sai)].sort());
    act(g, { type: 'pick', choice: ch(g, 'p1', SE.sai) });
    expect(g.power(ch(g, 'p1', SE.sai))).toBe(5000);
  });
});

describe('EB02-059 Without Your Help...: then, with 1 or less Life, play a yellow "Straw Hat Crew" Character or [Sanji] with cost 5 or less from the hand', () => {
  it('1 Life (boundary): offers yellow {Straw Hat Crew} cost <= 5 and a yellow [Sanji]; not too expensive, off-colour or off-type cards', () => {
    const g = defend({
      life: 1,
      hand: [
        SE.chopper4,
        SE.chopper5,
        SE.sanjiVinsmoke2,
        JINBE6,
        SE.frankyBlack5,
        SE.holly3,
        SE.mohji,
      ],
    });
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.chopper4, SE.chopper5, SE.sanjiVinsmoke2].sort());
  });

  it('plays the chosen Character active', () => {
    const g = defend({ life: 1, hand: [SE.chopper4, SE.luffyYellow3] });
    use(g);
    pickCards(g, [SE.luffyYellow3]);
    expect(chars(g)).toEqual([SE.luffyYellow3]);
    expect(g.card(ch(g, 'p1', SE.luffyYellow3)).rested).toBe(false);
    expect(hand(g)).toEqual([SE.chopper4]);
  });

  it('0 Life also qualifies', () => {
    const g = defend({ life: 0, hand: [SE.chopper4] });
    use(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([SE.chopper4]);
  });

  it('2 Life (boundary): nothing is played and no prompt is asked', () => {
    const g = defend({ life: 2, hand: [SE.chopper4] });
    use(g);
    expect(kind(g)).toBe('counter');
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SE.chopper4]);
  });

  it('cost boundary: a cost 5 Character qualifies, a cost 6 one does not', () => {
    const g = defend({ life: 1, hand: [SE.chopper5, JINBE6] });
    use(g);
    expect(offeredIds(g)).toEqual([SE.chopper5]);
  });

  it('"up to 1": may play nothing', () => {
    const g = defend({ life: 1, hand: [SE.chopper4] });
    use(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(hand(g)).toEqual([SE.chopper4]);
  });

  it('plays at most 1 Character', () => {
    const g = defend({ life: 1, hand: [SE.chopper4, SE.chopper5] });
    use(g);
    pickCards(g, [SE.chopper4]);
    expect(chars(g)).toHaveLength(1);
    expect(hand(g)).toEqual([SE.chopper5]);
  });

  it('1 Life with nothing playable in hand: the "up to" pick is still asked (the hand is hidden)', () => {
    const g = defend({ life: 1, hand: [SE.mohji] });
    use(g);
    const d = decision(g);
    expect(d?.kind).toBe('choose');
    expect(choices(g)).toEqual([]);
    expect(canFinish(g)).toBe(true);
    act(g, { type: 'done' });
    orderFirst(g);
    expect(kind(g)).toBe('counter');
  });
});
