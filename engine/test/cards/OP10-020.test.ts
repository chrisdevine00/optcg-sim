/** OP10-020 Gum-Gum UFO. */
import { describe, expect, it } from 'vitest';
import { dec, none, pick, play, trash, V } from './helpers.ts';
import { canPick, cardsOf, pw, start, trigGame } from './helpers-a10g4.ts';

const ID = 'OP10-020';
const lifeOf = (n: number) => Array.from({ length: n }, () => V.c1);

const main = (myLife: number, oppChars: string[]) =>
  start({ hand: [ID], characters: [V.c2], life: lifeOf(myLife) }, { characters: oppChars });

describe('OP10-020 Gum-Gum UFO', () => {
  it('[Main]: -4000 to an opponent Character, then with 2 or less Life +1000 to your Leader or a Character (boundary 2)', () => {
    const g = main(2, [V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(pw(g, 'p2', V.c5)).toBe(3000);
    expect(canPick(g, g.leader('p1'))).toBe(true);
    expect(canPick(g, g.find('p1', 'characters', V.c2))).toBe(true);
    expect(canPick(g, g.leader('p2'))).toBe(false);
    pick(g, [g.find('p1', 'characters', V.c2)]);
    expect(pw(g, 'p1', V.c2)).toBe(5000); // 4000 + 1000
    expect(trash(g, 'p1')).toEqual([ID]);
  });

  it('with 3 Life cards the +1000 is not given (and not asked)', () => {
    const g = main(3, [V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    expect(dec(g)?.kind).toBe('main');
    expect(pw(g, 'p1', V.c2)).toBe(4000); // unchanged
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the -4000 may be declined and the Life check still runs', () => {
    const g = main(0, [V.c5]);
    play(g, ID);
    none(g);
    expect(pw(g, 'p2', V.c5)).toBe(7000);
    pick(g, [g.leader('p1')]);
    expect(g.power(g.leader('p1'))).toBe(6000);
  });

  it('the -4000 and the +1000 last until the end of the turn only', () => {
    const g = main(1, [V.c5]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c5)]);
    pick(g, [g.leader('p1')]);
    g.act({ type: 'endTurn' });
    expect(pw(g, 'p2', V.c5)).toBe(7000);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it("[Trigger]: K.O. up to 1 of your opponent's Characters with 3000 power or less (boundary)", () => {
    const g = trigGame(ID, {}, [V.c1, V.c2]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c1))).toBe(true); // 3000
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false); // 4000
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false); // the attacker, 9000
    pick(g, [g.find('p2', 'characters', V.c1)]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7, V.c2]);
  });
});
