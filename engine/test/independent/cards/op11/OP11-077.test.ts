/**
 * OP11-077 Randolph (Character, Purple, cost 1, 2000, Counter +1000, {Big Mom Pirates}/{Homies}).
 *
 * Card text: "[Your Turn] [Once Per Turn] When a DON!! card on your field is returned to your DON!!
 * deck, up to 1 of your "Big Mom Pirates" type Characters gains +2 cost until the end of your
 * opponent's next turn."
 *
 * The DON!! return is made with OP11-072 Charlotte Mont-d'or ("[Activate: Main] [Once Per Turn]
 * DON!! −1, You may rest this Character: ...", {Big Mom Pirates}) and OP07-076 Slow-Slow Beam Sword
 * (Purple Event, "[Counter] DON!! −1: ... +2000 power ... Then, rest up to 1 of your opponent's Characters") on the opponent's turn.
 * Rules: CR 10-2 ([Your Turn] only on my turn; [Once Per Turn]), CR 8-4-4 ("up to"), RL-11 ("until
 * the end of your opponent's next turn" ends when that turn ends).
 */
import { describe, expect, it } from 'vitest';
import {
  act,
  at,
  attack,
  costNow,
  donField,
  kind,
  LD11,
  many,
  me,
  mayChooseNone,
  need,
  none,
  offeredIds,
  pickInst,
  SC11,
  useAbility,
  them,
  offeredAbilities,
  endTurn,
} from './kit-op11c.ts';

const ID = 'OP11-077';
const DON_RETURNER = 'OP11-072';

function board(o: { second?: boolean; extra?: string[] } = {}) {
  return me(
    LD11.katakuri,
    {
      characters: [ID, DON_RETURNER, ...(o.second ? [DON_RETURNER] : []), ...(o.extra ?? [])],
      life: [SC11.r1, SC11.r2, SC11.r3, SC11.r5],
    },
    { trash: [], deck: many(SC11.r4, 8) },
  );
}

describe('OP11-077 Randolph: +2 cost for a {Big Mom Pirates} Character when my DON!! returns to the DON!! deck', () => {
  it('printed effect: Mont-d’or’s DON!! −1 lets me give +2 cost to a {Big Mom Pirates} Character', () => {
    const g = board();
    const target = at(g, 'p1', 'characters', DON_RETURNER);
    expect(costNow(g, target)).toBe(3);
    useAbility(g, target);
    need(g, 'choose', 'p1');
    pickInst(g, [target]);
    expect(costNow(g, target)).toBe(5);
    expect(kind(g)).toBe('main');
  });

  it('Randolph itself is a {Big Mom Pirates} Character and may take the +2 cost', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', DON_RETURNER));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toContain(ID);
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    expect(costNow(g, at(g, 'p1', 'characters', ID))).toBe(3);
  });

  it('only {Big Mom Pirates} Characters are offered, not other Characters', () => {
    const g = board({ extra: [SC11.r3, SC11.navyB3] });
    useAbility(g, at(g, 'p1', 'characters', DON_RETURNER));
    need(g, 'choose', 'p1');
    expect(offeredIds(g)).toEqual([ID, DON_RETURNER].sort());
  });

  it('"up to 1": I may give the +2 cost to nobody', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', DON_RETURNER));
    expect(mayChooseNone(g)).toBe(true);
    none(g);
    expect(costNow(g, at(g, 'p1', 'characters', DON_RETURNER))).toBe(3);
    expect(costNow(g, at(g, 'p1', 'characters', ID))).toBe(1);
  });

  it('only 1 Character gains the cost, never 2', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', DON_RETURNER));
    const d = need(g, 'choose', 'p1');
    expect(d.max).toBe(1);
  });

  it('[Once Per Turn]: a second DON!! return in the same turn gives no second prompt', () => {
    const g = board({ second: true });
    const m1 = at(g, 'p1', 'characters', DON_RETURNER, 0);
    const m2 = at(g, 'p1', 'characters', DON_RETURNER, 1);
    useAbility(g, m1);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    useAbility(g, m2);
    expect(kind(g)).not.toBe('choose');
    expect(costNow(g, at(g, 'p1', 'characters', ID))).toBe(3);
    expect(costNow(g, m2)).toBe(3);
  });

  it('duration: the +2 cost lasts through my opponent’s next turn and is gone after it', () => {
    const g = board();
    const target = at(g, 'p1', 'characters', ID);
    useAbility(g, at(g, 'p1', 'characters', DON_RETURNER));
    pickInst(g, [target]);
    expect(costNow(g, target)).toBe(3);
    endTurn(g);
    need(g, 'main', 'p2');
    expect(costNow(g, target)).toBe(3);
    act(g, { type: 'endTurn' });
    need(g, 'main', 'p1');
    expect(costNow(g, target)).toBe(1);
  });

  it('must not trigger on the opponent’s turn ([Your Turn]): a [Counter] DON!! −1 does nothing here', () => {
    const g = them(
      LD11.impelDown,
      {
        characters: [ID],
        hand: ['OP07-076'],
        costArea: { active: 3, rested: 0 },
      },
      { characters: [SC11.r5] },
    );
    attack(g, at(g, 'p2', 'characters', SC11.r5), g.leader('p1'));
    act(g, { type: 'block', blocker: null });
    const ev = g
      .legal()
      .find((a) => a.type === 'activate' && a.card === at(g, 'p1', 'hand', 'OP07-076'));
    expect(ev).toBeDefined();
    g.act(ev!);
    // Whatever the Event asks (its own target), Randolph must not ask for its cost target.
    for (let i = 0; i < 8 && g.decider === 'p1' && kind(g) !== 'counter'; i++) {
      const d = need(g, kind(g) ?? 'main');
      expect(d.source?.card).not.toBe(ID);
      if (d.kind === 'optional') {
        act(g, { type: 'optional', accept: true });
        continue;
      }
      const p = g.legal().find((a) => a.type === 'pick');
      if (p) g.act(p);
      else act(g, { type: 'done' });
    }
    expect(donField(g)).toBe(2);
    expect(costNow(g, at(g, 'p1', 'characters', ID))).toBe(1);
  });

  it('must not trigger when no DON!! is returned: Mont-d’or unusable without DON!! gives no prompt', () => {
    const g = me(
      LD11.katakuri,
      { characters: [ID, DON_RETURNER], costArea: { active: 0, rested: 0 } },
      {},
    );
    expect(offeredAbilities(g, at(g, 'p1', 'characters', DON_RETURNER))).toEqual([]);
    expect(costNow(g, at(g, 'p1', 'characters', ID))).toBe(1);
  });

  it('the cost is not changed permanently: after the effect ends it is the printed cost again (cost-1 Randolph)', () => {
    const g = board();
    useAbility(g, at(g, 'p1', 'characters', DON_RETURNER));
    pickInst(g, [at(g, 'p1', 'characters', ID)]);
    endTurn(g);
    act(g, { type: 'endTurn' });
    expect(costNow(g, at(g, 'p1', 'characters', ID))).toBe(1);
  });
});
