/**
 * OP15-116 Gum-Gum Golden Rifle (Event, Yellow, cost 1, {Straw Hat Crew}/{Sky Island}).
 *
 * Card text: "[Main] If your Leader has the {Straw Hat Crew} type, trash 1 card from the top of your
 * Life cards. Then, add up to 1 card from the top of your deck to the top of your Life cards and
 * trash 1 card from your hand.
 * [Counter] Your Leader gains +4000 power during this battle."
 *
 * Rules: a Life card trashed by an effect is not damage (no [Trigger], rules-digest Life items),
 * CR 8-4-4-1 ("up to"), M4b-5 (a "Then" after a failed "If" does not resolve), CR 7-1-4 (the
 * attacker wins a power tie). Defeat comes from damage at 0 Life, not from an empty Life zone.
 * Not asserted: whether the hand card is still trashed when the player adds no card to Life.
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  attack,
  cardIds,
  chooseIfAsked,
  chr,
  fill,
  hand,
  kind,
  lifeCards,
  mine,
  need,
  no,
  offeredIds,
  passBlock,
  pickInst,
  playRaw,
  takeDamage,
  theirsW,
  trash,
  useCounter,
  W4,
  yes,
  deck,
} from './kit-w4a.ts';

const RIFLE = 'OP15-116';
const FILL = W4.mohjiBlue;

function board(opts: { leader?: string; life?: string[]; hand?: string[]; deck?: string[] }) {
  return mine(
    opts.leader ?? W4.luffy,
    {
      hand: [RIFLE, ...(opts.hand ?? [W4.sai, W4.hajrudin])],
      life: opts.life ?? [W4.marco, W4.kingdew, FILL, FILL],
      deck: opts.deck ?? [W4.thatch, ...fill(FILL, 14)],
    },
    {},
  );
}

describe('OP15-116 Gum-Gum Golden Rifle: [Main]', () => {
  it('printed values: Event, cost 1', () => {
    const g = board({});
    expect(g.card(at(g, 'p1', 'hand', RIFLE)).cost).toBe(1);
  });

  it('with a {Straw Hat Crew} Leader: trashes the top Life, adds the deck top as the new top Life, trashes 1 hand card', () => {
    const g = board({});
    playRaw(g, RIFLE);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(lifeCards(g)).toEqual([W4.thatch, W4.kingdew, FILL, FILL]);
    expect(trash(g, 'p1').sort()).toEqual([RIFLE, W4.marco, W4.sai].sort());
    expect(hand(g)).toEqual([W4.hajrudin]);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it('the hand pick offers every card in hand (the Event itself is no longer there)', () => {
    const g = board({ hand: [W4.sai, W4.hajrudin, W4.kingdew] });
    playRaw(g, RIFLE);
    yes(g, 'p1');
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([W4.hajrudin, W4.kingdew, W4.sai].sort());
  });

  it('boundary: Life count stays the same (one out, one in) and the deck loses one card', () => {
    const g = board({});
    playRaw(g, RIFLE);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(g.life('p1')).toBe(4);
    expect(deck(g)).toHaveLength(14);
  });

  it('"up to 1": declining the add leaves Life one lower and the deck untouched', () => {
    const g = board({});
    playRaw(g, RIFLE);
    no(g, 'p1');
    // A hand trash may still follow; answer it if asked (not asserted either way).
    if (kind(g) === 'choose') pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(lifeCards(g)).toEqual([W4.kingdew, FILL, FILL]);
    expect(deck(g)).toHaveLength(15);
    expect(trash(g, 'p1')).toContain(W4.marco);
  });

  it('a Leader without {Straw Hat Crew}: the whole effect does nothing (no Life trashed, no card added, no hand trash)', () => {
    const g = board({ leader: W4.shanks });
    playRaw(g, RIFLE);
    expect(atMain(g, 'p1')).toBe(true);
    expect(lifeCards(g)).toEqual([W4.marco, W4.kingdew, FILL, FILL]);
    expect(deck(g)).toHaveLength(15);
    expect(hand(g)).toEqual([W4.hajrudin, W4.sai].sort());
    expect(trash(g, 'p1')).toEqual([RIFLE]);
  });

  it('a Leader with {Straw Hat Crew} as one of several types works (OP16-022 is {Straw Hat Crew}/{Impel Down})', () => {
    const g = board({ leader: 'OP16-022' });
    playRaw(g, RIFLE);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(lifeCards(g)[0]).toBe(W4.thatch);
  });

  it('the trashed Life card is not damage: its [Trigger] does not activate', () => {
    const g = board({ life: [W4.speed, W4.kingdew, FILL, FILL] });
    playRaw(g, RIFLE);
    expect(kind(g)).not.toBe('trigger');
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(trash(g, 'p1')).toContain(W4.speed);
    expect(cardIds(g, 'p1', 'characters')).toEqual([]);
  });

  it('with 1 Life card: it is trashed, a new one added, and the game goes on', () => {
    const g = board({ life: [W4.marco] });
    playRaw(g, RIFLE);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(lifeCards(g)).toEqual([W4.thatch]);
    expect(atMain(g, 'p1')).toBe(true);
  });

  it("only my own Life and deck are involved: the opponent's zones do not change", () => {
    const g = board({});
    const oppLife = lifeCards(g, 'p2');
    const oppDeck = deck(g, 'p2').length;
    playRaw(g, RIFLE);
    yes(g, 'p1');
    pickInst(g, [at(g, 'p1', 'hand', W4.sai)]);
    expect(lifeCards(g, 'p2')).toEqual(oppLife);
    expect(deck(g, 'p2')).toHaveLength(oppDeck);
  });
});

describe('OP15-116 Gum-Gum Golden Rifle: [Counter] Leader +4000 this battle', () => {
  function defend() {
    return theirsW(
      {
        hand: [RIFLE],
        costArea: { active: 2, rested: 0 },
        characters: [W4.marco],
      },
      { characters: [W4.thatch, W4.oars] },
    );
  }

  it('+4000 makes the 5000 Leader (9000) survive an 8000 attacker', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.thatch), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', RIFLE), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(9000);
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(4);
  });

  it('boundary: 9000 against a 9000 attacker is a tie, which the attacker wins', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.oars), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', RIFLE), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.life('p1')).toBe(3);
  });

  it('boosts the Leader only, and only for the battle', () => {
    const g = defend();
    attack(g, chr(g, 'p2', W4.thatch), g.leader('p1'));
    passBlock(g);
    useCounter(g, at(g, 'p1', 'hand', RIFLE), g.leader('p1'));
    chooseIfAsked(g, [g.leader('p1')]);
    expect(g.power(chr(g, 'p1', W4.marco))).toBe(5000);
    g.act({ type: 'endCounter' });
    takeDamage(g);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
