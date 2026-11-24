/**
 * OP14-068 Trebol (Character, Purple, cost 5, 5000, Counter +2000, {Donquixote Pirates}).
 *
 * Card text: "[Opponent's Turn] [Once Per Turn] When a DON!! card on your field is returned to your
 * DON!! deck, if your Leader has the {Donquixote Pirates} type, add up to 1 DON!! card from your
 * DON!! deck and rest it."
 *
 * Rules: [Opponent's Turn] (CR 10-2-8), [Once Per Turn] (CR 10-2-13: used when it resolves),
 * RL-23 (DON!! returned by a cost, by my own effect or by the opponent's effect all count),
 * "add up to N DON!!" asks a count. Triggered effects resolve after the effect that caused them.
 *
 * Sources of DON!! returns used here: OP14-078 Bullet String ([Counter] DON!! −1, in my Counter
 * Step on the opponent's turn), OP09-077 Gum-Gum Lightning ([Main] DON!! −2) and OP14-062 Gladius
 * (its [On K.O.] DON!! −1 cost, paid on the opponent's turn).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  activateCounter,
  addDon,
  asksCount,
  at,
  attack,
  backToMain,
  chars,
  donOf14,
  kind,
  LD14,
  LIGHTNING,
  mine,
  need,
  onField,
  passBlock,
  payDon,
  pickInst,
  playRaw,
  SC14,
  theirs,
  yes,
  none,
  countOptions,
  hand,
} from './kit-op14c.ts';

const ID = 'OP14-068';
const BULLET = 'OP14-078';
const GLADIUS = 'OP14-062';

/** p2 attacks my Leader with its Leader; I (p1) do not block and open my Counter Step. */
function underAttack(o: { leader?: string; hand?: string[]; active?: number; p2chars?: string[] }) {
  const g = theirs(
    o.leader ?? LD14.dp,
    {
      characters: [ID],
      hand: o.hand ?? [BULLET],
      costArea: { active: o.active ?? 5, rested: 0 },
    },
    { characters: o.p2chars ?? [] },
  );
  attack(g, g.leader('p2'), g.leader('p1'));
  passBlock(g);
  need(g, 'counter', 'p1');
  return g;
}

/** Use one Bullet String in the Counter Step: pay DON!! −1 (from the cost area) and boost my Leader. */
function useBullet(g: ReturnType<typeof underAttack>) {
  activateCounter(g, at(g, 'p1', 'hand', BULLET));
  yes(g, 'p1');
  payDon(g, 1, 'costActive');
  need(g, 'choose', 'p1');
  pickInst(g, [g.leader('p1')]);
}

describe("OP14-068 Trebol [Opponent's Turn][Once Per Turn] DON!! returned: add a rested DON!!", () => {
  it('on the opponent’s turn, a DON!! of mine returned to the DON!! deck lets me add up to 1 (asked as a count)', () => {
    const g = underAttack({});
    useBullet(g);
    need(g, 'choose', 'p1');
    expect(countOptions(g).sort()).toEqual(['0', '1']);
    addDon(g, 1);
    expect(kind(g)).toBe('counter');
  });

  it('the added DON!! comes from the DON!! deck and is RESTED; net the field has the same DON!!', () => {
    const g = underAttack({});
    const before = donOf14(g);
    useBullet(g);
    addDon(g, 1);
    const after = donOf14(g);
    expect(after.deck).toBe(before.deck); // +1 returned, -1 added
    expect(onField(g)).toBe(5);
    // Bullet String's own cost rests 2 DON!!, one active DON!! is returned, one rested is added.
    expect(after.rested).toBe(before.rested + 3);
    expect(after.active).toBe(before.active - 3);
  });

  it('"up to 1": adding none adds nothing', () => {
    const g = underAttack({});
    const before = donOf14(g);
    useBullet(g);
    addDon(g, 0);
    expect(onField(g)).toBe(4);
    expect(donOf14(g).deck).toBe(before.deck + 1);
  });

  it('[Once Per Turn]: a second return in the same opponent turn does not trigger it again', () => {
    const g = underAttack({ hand: [BULLET, BULLET], active: 6, p2chars: [SC14.c3] });
    useBullet(g);
    addDon(g, 1);
    act(g, { type: 'endCounter' });
    // Damage is dealt or blocked by the boost; then a second attack by their Character.
    expect(donOf14(g).rested).toBe(3);
    attack(g, at(g, 'p2', 'characters', SC14.c3), g.leader('p1'));
    passBlock(g);
    need(g, 'counter', 'p1');
    useBullet(g);
    expect(asksCount(g)).toBe(false);
    expect(kind(g)).toBe('counter');
    expect(onField(g)).toBe(5);
  });

  it('only on the OPPONENT’s turn: my own Gum-Gum Lightning (DON!! −2) on my turn does not trigger it', () => {
    const g = mine(
      LD14.dp,
      { characters: [ID], hand: [LIGHTNING], costArea: { active: 6, rested: 0 } },
      { characters: [SC14.c3] },
    );
    playRaw(g, LIGHTNING);
    yes(g, 'p1');
    payDon(g, 2, 'costRested');
    // The next decision is the Event's target, not Trebol's count.
    expect(asksCount(g)).toBe(false);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p2', 'characters', SC14.c3)]);
    backToMain(g, 'p1');
    expect(onField(g)).toBe(4);
    expect(chars(g)).toEqual([ID]);
  });

  it('the Leader must have the {Donquixote Pirates} type: with another Leader nothing is added', () => {
    const g = underAttack({ leader: LD14.plain });
    activateCounter(g, at(g, 'p1', 'hand', BULLET));
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    // Bullet String's own condition fails as well, so it may not even ask for a target.
    if (kind(g) === 'choose') pickInst(g, [g.leader('p1')]);
    expect(asksCount(g)).toBe(false);
    expect(onField(g)).toBe(4);
    expect(kind(g)).toBe('counter');
  });

  it('a DON!! returned as the cost of my own [On K.O.] (Gladius, DON!! −1) counts too', () => {
    const g = theirs(
      LD14.dp,
      { characters: [ID, { card: GLADIUS, rested: true }], costArea: { active: 3, rested: 0 } },
      { characters: [] },
    );
    attack(g, g.leader('p2'), at(g, 'p1', 'characters', GLADIUS));
    passBlock(g);
    if (kind(g) === 'counter') act(g, { type: 'endCounter' });
    yes(g, 'p1');
    payDon(g, 1, 'costActive');
    // Gladius asks K.O. or rest, then (no target on their empty field) an empty "up to" pick; then
    // Trebol asks how many DON!! to add.
    for (let i = 0; i < 6 && kind(g) === 'choose' && !asksCount(g); i++) {
      const d = g.legal().find((x) => x.type === 'pick' && typeof x.choice === 'object');
      if (d) g.act(d);
      else act(g, { type: 'done' });
    }
    expect(asksCount(g)).toBe(true);
    addDon(g, 1);
    expect(onField(g)).toBe(3);
    expect(donOf14(g).rested).toBe(1);
  });

  it('their own DON!! returns (Lightning, DON!! −2, on their turn) do not trigger my Trebol', () => {
    const g = theirs(
      LD14.dp,
      { characters: [ID, SC14.c3], costArea: { active: 3, rested: 0 } },
      { hand: [LIGHTNING], characters: [], costArea: { active: 9, rested: 0 } },
    );
    act(g, { type: 'playCard', card: at(g, 'p2', 'hand', LIGHTNING) });
    for (let i = 0; i < 5 && kind(g) === 'choose' && g.decider === 'p2'; i++) {
      const pick = g.legal().find((a) => a.type === 'pick');
      if (!pick) break;
      g.act(pick);
    }
    if (kind(g) === 'optional') yes(g, 'p2');
    // Nothing is ever owed by p1.
    for (let i = 0; i < 12 && g.decider === 'p2' && kind(g) !== 'main'; i++) {
      const a =
        g.legal().find((x) => x.type === 'pick') ?? g.legal().find((x) => x.type === 'done');
      if (!a) break;
      g.act(a);
    }
    expect(g.decider).toBe('p2');
    expect(onField(g, 'p1')).toBe(3);
    expect(hand(g)).toEqual([]);
    void none;
  });
});
