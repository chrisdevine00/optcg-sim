/**
 * EB03-029 Insolent Fool!! Stand Down!! (Event, Blue, cost 1, {Kuja Pirates}/{The Seven Warlords of the
 * Sea}).
 *
 * Card text: "[Main] You may rest 4 of your DON!! cards: If your Leader is [Boa Hancock], play up to 1
 * {Amazon Lily} or {Kuja Pirates} type Character card with a cost of 6 or less from your hand.
 * [Counter] Up to 1 of your [Boa Hancock] cards gains +3000 power during this battle."
 *
 * Rules: CR 8-3-1 (a "you may" cost is optional and all-or-nothing; unpayable costs are offered with
 * accept illegal), CR 8-3-3 (conditions), effect plays pay no cost, CR 8-4-4-1 ("up to"),
 * CR 7-1-3-1-2 (Event [Counter]), RL-08 ("during this battle"). "[Boa Hancock] cards" means cards named
 * Boa Hancock: my Leader and my Characters.
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  attack,
  BLUE,
  canCounterWith,
  chooseIfAsked,
  choiceCards,
  chr,
  decision,
  donOf,
  fill,
  hand,
  inst,
  kind,
  LA,
  mine,
  need,
  none,
  no,
  offeredIds,
  passBlock,
  passCounter,
  pickCards,
  pickInOrder,
  playRaw,
  SA,
  theirs,
  unusable,
  useCounter,
  yes,
  zoneIds,
} from './kit-eb03a.ts';

const EVENT = 'EB03-029';
/** OP08-048 Sweetpea: Blue, cost 4, 6000, {Amazon Lily}, vanilla (stats only). */
const LILY4 = 'OP08-048';
/** OP08-046 Shakuyaku: Blue, cost 5, 6000, {Amazon Lily} (stats only: inert). */
const LILY5 = 'OP08-046';
/** OP16-112 Boa Hancock: Blue, cost 6, 8000, {Kuja Pirates}, vanilla (stats only). */
const KUJA6 = 'OP16-112';
/** OP16-032 Boa Hancock: Blue, cost 7, 9000, {Kuja Pirates}/{Seven Warlords}/{Impel Down} (never played here). */
const KUJA7 = 'OP16-032';
/** OP01-078 Boa Hancock: Blue, cost 4, 5000, {Kuja Pirates}/{The Seven Warlords of the Sea}, [Blocker] (stats only). */
const HANCOCK_CHAR = 'OP01-078';

/** Drive the [Main] after the Event is played: say yes, pay 4 DON!!, stop at the first target pick. */
function mainStart(leader: string, hand_: string[], active = 10) {
  const g = mine(leader, {
    hand: [EVENT, ...hand_],
    costArea: { active, rested: 0 },
    deck: fill(BLUE, 10),
  });
  playRaw(g, EVENT);
  return g;
}

function payFour(g: ReturnType<typeof mainStart>) {
  yes(g, 'p1');
  // All the DON!! are active, so the engine may rest the 4 itself (one class only): then nothing is asked.
  if (decision(g)?.kind === 'choose' && decision(g)?.purpose === 'cost') {
    pickInOrder(g, [], 4, 'costActive');
  }
}

describe('EB03-029: printed values', () => {
  it('Event, cost 1', () => {
    const g = mine(LA.hancock, { hand: [EVENT] });
    expect(g.card(inst(g, 'p1', 'hand', EVENT)).cost).toBe(1);
  });
});

describe('EB03-029: [Main] you may rest 4 DON!!: if your Leader is [Boa Hancock], play up to 1 {Amazon Lily}/{Kuja Pirates} Character with cost 6 or less from hand', () => {
  it('offers the {Amazon Lily} / {Kuja Pirates} Characters with cost 6 or less (6 allowed, 7 not), nothing else', () => {
    const g = mainStart(LA.hancock, [LILY4, LILY5, KUJA6, KUJA7, SA.marco, SA.guardPoint]);
    payFour(g);
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([KUJA6, LILY4, LILY5].sort());
  });

  it('plays the chosen Character without paying its cost, active; 5 DON!! are rested in total (Event 1 + cost 4)', () => {
    const g = mainStart(LA.hancock, [KUJA6]);
    payFour(g);
    pickCards(g, [KUJA6]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([KUJA6]);
    expect(g.card(chr(g, 'p1', KUJA6)).rested).toBe(false);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 5 });
    expect(zoneIds(g, 'p1', 'trash')).toEqual([EVENT]);
    expect(kind(g)).toBe('main');
  });

  it('"up to 1": may play nothing (the 4 DON!! stay rested: the cost was paid)', () => {
    const g = mainStart(LA.hancock, [LILY4]);
    payFour(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([LILY4]);
    expect(donOf(g, 'p1')).toMatchObject({ rested: 5 });
  });

  it('plays at most 1 even with several candidates', () => {
    const g = mainStart(LA.hancock, [LILY4, KUJA6]);
    payFour(g);
    pickCards(g, [LILY4]);
    expect(zoneIds(g, 'p1', 'characters')).toHaveLength(1);
  });

  it('"you may": declining the cost rests only the Event\'s own 1 DON!! and plays nothing', () => {
    const g = mainStart(LA.hancock, [LILY4]);
    no(g, 'p1');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 9, rested: 1 });
    expect(hand(g)).toEqual([LILY4]);
  });

  it("with fewer than 4 DON!! left after the Event's own cost the effect cannot be used", () => {
    const g = mainStart(LA.hancock, [LILY4], 4);
    unusable(g, 'p1');
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 3, rested: 1 });
  });

  it('with a Leader that is not [Boa Hancock] no Character is played', () => {
    const g = mainStart(LA.croc, [LILY4, KUJA6]);
    // Whatever is asked (the cost question, the cost pick, an empty or filled target pick), nothing is played.
    for (let i = 0; i < 8; i++) {
      const d = decision(g);
      if (!d || d.player !== 'p1' || d.kind === 'main') break;
      if (d.kind === 'optional') yes(g, 'p1');
      else if (d.kind === 'choose' && d.purpose === 'cost') pickInOrder(g, [], 4, 'costActive');
      else if (d.kind === 'choose') {
        const pick = g.legal().find((a) => a.type === 'pick');
        if (pick) g.act(pick);
        else act(g, { type: 'done' });
      } else break;
    }
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(hand(g)).toEqual([KUJA6, LILY4].sort());
  });

  it('a [Boa Hancock] Character on the field does not stand in for the Leader condition', () => {
    const g = mine(LA.croc, {
      hand: [EVENT, LILY4],
      characters: [HANCOCK_CHAR],
      costArea: { active: 10, rested: 0 },
    });
    playRaw(g, EVENT);
    for (let i = 0; i < 8; i++) {
      const d = decision(g);
      if (!d || d.player !== 'p1' || d.kind === 'main') break;
      if (d.kind === 'optional') yes(g, 'p1');
      else if (d.kind === 'choose' && d.purpose === 'cost') pickInOrder(g, [], 4, 'costActive');
      else if (d.kind === 'choose') {
        const pick = g.legal().find((a) => a.type === 'pick');
        if (pick) g.act(pick);
        else act(g, { type: 'done' });
      } else break;
    }
    expect(zoneIds(g, 'p1', 'characters')).toEqual([HANCOCK_CHAR]);
    expect(hand(g)).toEqual([LILY4]);
  });

  it('only cards in hand are played: a candidate in the trash is not offered', () => {
    const g = mine(LA.hancock, {
      hand: [EVENT],
      trash: [KUJA6],
      costArea: { active: 10, rested: 0 },
    });
    playRaw(g, EVENT);
    payFour(g);
    if (kind(g) === 'choose') {
      expect(offeredIds(g)).toEqual([]);
      none(g);
    }
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
  });
});

describe('EB03-029: [Counter] up to 1 of your [Boa Hancock] cards gains +3000 power during this battle', () => {
  function underAttack(leader: string, chars: string[] = [], active = 2) {
    const g = theirs(
      leader,
      { hand: [EVENT], characters: chars, costArea: { active, rested: 0 }, life: fill(BLUE, 4) },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    return g;
  }

  it('a [Boa Hancock] Leader gains +3000 (5000 -> 8000) and the 5000 attack fails', () => {
    const g = underAttack(LA.hancock);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(true);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(8000);
    passCounter(g);
    expect(g.life('p1')).toBe(4);
  });

  it('a [Boa Hancock] Character is a legal target (5000 -> 8000), the Leader stays at 5000', () => {
    const g = underAttack(LA.hancock, [HANCOCK_CHAR]);
    const h = chr(g, 'p1', HANCOCK_CHAR);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), h);
    chooseIfAsked(g, [h]);
    expect(g.power(h)).toBe(8000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('offers only cards named Boa Hancock: not other Characters, not a different Leader', () => {
    const g = underAttack(LA.croc, [HANCOCK_CHAR, SA.marco]);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), chr(g, 'p1', HANCOCK_CHAR));
    if (kind(g) === 'choose') {
      expect(choiceCards(g)).toEqual([HANCOCK_CHAR]);
    }
  });

  it('there is no Leader condition on the [Counter]: a Hancock Character works under another Leader', () => {
    const g = underAttack(LA.croc, [HANCOCK_CHAR]);
    const h = chr(g, 'p1', HANCOCK_CHAR);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), h);
    chooseIfAsked(g, [h]);
    expect(g.power(h)).toBe(8000);
  });

  it('with no [Boa Hancock] card at all nobody is boosted', () => {
    const g = underAttack(LA.croc, [SA.marco]);
    if (canCounterWith(g, inst(g, 'p1', 'hand', EVENT))) {
      useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
      if (kind(g) === 'choose') none(g);
    }
    expect(g.power(g.leader('p1'))).toBe(5000);
    expect(g.power(chr(g, 'p1', SA.marco))).toBe(5000);
  });

  it('"up to 1": may boost nobody', () => {
    const g = underAttack(LA.hancock);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    if (kind(g) === 'choose') none(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('the boost lasts during the battle only', () => {
    const g = underAttack(LA.hancock);
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    act(g, { type: 'endCounter' });
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('it needs only its own 1 DON!!, not the 4 of the [Main]', () => {
    const g = underAttack(LA.hancock, [], 1);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(true);
  });

  it('with 0 active DON!! the Event cannot be used', () => {
    const g = underAttack(LA.hancock, [], 0);
    expect(canCounterWith(g, inst(g, 'p1', 'hand', EVENT))).toBe(false);
  });

  it('using it as a [Counter] runs the Counter only: no Character is played and no 4 DON!! are rested', () => {
    const g = theirs(
      LA.hancock,
      { hand: [EVENT, KUJA6], costArea: { active: 6, rested: 0 }, life: fill(BLUE, 4) },
      {},
    );
    attack(g, g.leader('p2'), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useCounter(g, inst(g, 'p1', 'hand', EVENT), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(zoneIds(g, 'p1', 'characters')).toEqual([]);
    expect(donOf(g, 'p1')).toMatchObject({ active: 5, rested: 1 });
    expect(hand(g)).toEqual([KUJA6]);
  });
});
