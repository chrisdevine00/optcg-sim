/** OP11-088 Shu (Character, cost 4, 5000, [Blocker]). */
import { describe, expect, it } from 'vitest';
import {
  accept,
  decline,
  dec,
  endCounter,
  game,
  passBlock,
  PLAIN_BLUE,
  PLAIN_PURPLE,
  takeDamage,
  V,
} from './helpers.ts';

const ID = 'OP11-088';
const SLASH = V.c3; // 5000, <Slash>
const RANGED = V.c4; // 6000, <Ranged>
const STRIKE = V.c2; // 4000, <Strike>

/** p2 (active, turn 4) has the given Characters and a Leader <Strike>; p1 has Shu (active). */
const mk = (chars: string[] = [SLASH, RANGED, STRIKE]) =>
  game(
    { leader: PLAIN_BLUE, characters: [ID], life: [V.c6, V.c6, V.c6] },
    { leader: PLAIN_PURPLE, characters: chars },
    { activePlayer: 'p2', turn: 4 },
  );
const shu = (g: ReturnType<typeof mk>) => g.find('p1', 'characters', ID);
const attack = (g: ReturnType<typeof mk>, who: string | 'leader', use = true) => {
  g.act({
    type: 'attack',
    attacker: who === 'leader' ? g.leader('p2') : g.find('p2', 'characters', who),
    target: g.leader('p1'),
  });
  // "This effect can be activated" (W57-R5): Shu's controller is asked, whoever attacks.
  if (dec(g)?.kind === 'optional') (use ? accept : decline)(g);
};
const finish = (g: ReturnType<typeof mk>) => {
  passBlock(g);
  endCounter(g);
  takeDamage(g);
};

describe('OP11-088 Shu', () => {
  it('a <Slash> Character attacks: Shu gains +5000 power during this battle (boundary: 5000 to 10000)', () => {
    const g = mk();
    expect(g.power(shu(g))).toBe(5000);
    attack(g, SLASH);
    expect(g.power(shu(g))).toBe(10000);
    finish(g);
    expect(g.power(shu(g))).toBe(5000); // the battle is over
  });

  it('as a Blocker with the boost it beats the 5000 <Slash> attacker and survives', () => {
    const g = mk();
    attack(g, SLASH);
    g.act({ type: 'block', blocker: shu(g) });
    endCounter(g);
    expect(g.zone('p1', 'characters').map((c) => c.card)).toEqual([ID]);
    expect(g.life('p1')).toBe(3);
  });

  it('a Character that is not <Slash> (Ranged, Strike) gives no boost: Shu blocking the 6000 Ranged one is K.O.’d', () => {
    const g = mk();
    attack(g, RANGED);
    expect(g.power(shu(g))).toBe(5000);
    g.act({ type: 'block', blocker: shu(g) });
    endCounter(g);
    expect(g.zone('p1', 'characters')).toHaveLength(0);
  });

  it('Once Per Turn: a first attack by a non-<Slash> Character uses it up, so the <Slash> one that follows gets nothing', () => {
    const g = mk();
    attack(g, STRIKE);
    finish(g);
    attack(g, SLASH);
    expect(g.power(shu(g))).toBe(5000);
  });

  it('"can be activated": it is asked, and declining it keeps the Once Per Turn for a later attack', () => {
    const g = mk();
    g.act({ type: 'attack', attacker: g.find('p2', 'characters', STRIKE), target: g.leader('p1') });
    expect(dec(g)?.kind).toBe('optional');
    decline(g);
    expect(g.power(shu(g))).toBe(5000);
    finish(g);
    attack(g, SLASH);
    expect(g.power(shu(g))).toBe(10000);
  });

  it('a <Slash> attacker after a <Slash> attacker: only the first gets the boost this turn', () => {
    const g = mk([SLASH, SLASH]);
    attack(g, SLASH);
    expect(g.power(shu(g))).toBe(10000);
    finish(g);
    g.act({
      type: 'attack',
      attacker: g.find('p2', 'characters', SLASH, 1),
      target: g.leader('p1'),
    });
    expect(g.power(shu(g))).toBe(5000);
  });

  it('the Leader attacking does not trigger it and does not spend it', () => {
    const g = mk();
    attack(g, 'leader');
    expect(g.power(shu(g))).toBe(5000);
    finish(g);
    attack(g, SLASH);
    expect(g.power(shu(g))).toBe(10000); // still available
  });

  it('it is the opponent’s attack that counts: Shu does not boost against its own side’s attack', () => {
    // p1's turn: p1's <Slash> Character attacks; Shu (p1) is not "your opponent's Character attacks".
    const g = game(
      { leader: PLAIN_BLUE, characters: [ID, SLASH] },
      { leader: PLAIN_PURPLE, life: [V.c6, V.c6, V.c6] },
    );
    g.act({
      type: 'attack',
      attacker: g.find('p1', 'characters', SLASH),
      target: g.leader('p2'),
    });
    expect(g.power(g.find('p1', 'characters', ID))).toBe(5000);
  });
});
