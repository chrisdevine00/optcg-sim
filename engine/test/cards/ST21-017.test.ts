/** ST21-017 Gum-Gum Mole Pistol. */
import { describe, expect, it } from 'vitest';
import { expectDecision, game, none, pick, play, PLAIN_BLUE, V } from './helpers.ts';
import { damageWith } from './triggers.ts';
import { cardsOf, donArea, SHC, SHC_LEADER } from './helpers-luffyace.ts';

const ID = 'ST21-017';
const ROUGE = 'OP13-014'; // Red vanilla, 0 power

describe('ST21-017 Gum-Gum Mole Pistol', () => {
  const start = (mine: string[], theirs: string[]) =>
    game(
      { leader: SHC_LEADER, hand: [ID], characters: mine, ...donArea(4) },
      { leader: PLAIN_BLUE, characters: theirs },
    );

  it('[Main]: -5000 power to an opposing Character, then with a 6000-power Character K.O. one with 2000 power or less', () => {
    const g = start([SHC.franky4], [V.c4, V.c7]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    const target = g.find('p2', 'characters', V.c4);
    pick(g, [target]);
    expect(g.power(target)).toBe(1000);
    // The 6000 Character became K.O.-able through the -5000 (power is read after it).
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(1);
    pick(g, [target]);
    expect(cardsOf(g, 'p2', 'trash')).toEqual([V.c4]);
    expect(cardsOf(g, 'p2', 'characters')).toEqual([V.c7]);
    expect(g.power(g.find('p2', 'characters', V.c7))).toBe(9000);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });

  it('[Main]: the K.O. may take a different Character that already has 2000 power or less', () => {
    const g = start([SHC.franky4], [V.c4, ROUGE]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    pick(g, [g.find('p2', 'characters', ROUGE)]);
    expect(cardsOf(g, 'p2', 'trash')).toEqual([ROUGE]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(1000);
  });

  it('[Main]: without a Character of 6000 power or more there is only the -5000', () => {
    const g = start([SHC.jinbe2], [V.c4, ROUGE]);
    play(g, ID);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(g.power(g.find('p2', 'characters', V.c4))).toBe(1000);
    expectDecision(g, 'main', 'p1');
    expect(cardsOf(g, 'p2', 'trash')).toEqual([]);
  });

  it('[Main]: a Character with more than 6000 power also satisfies "6000 power or more"', () => {
    const g = start([SHC.nami5], [ROUGE]);
    play(g, ID);
    none(g); // no -5000 target chosen
    pick(g, [g.find('p2', 'characters', ROUGE)]);
    expect(cardsOf(g, 'p2', 'trash')).toEqual([ROUGE]);
  });

  it('[Main]: "Then, if" is its own condition: the -5000 need not have been given', () => {
    const g = start([SHC.franky4], [ROUGE]);
    play(g, ID);
    none(g);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p2', 'characters', ROUGE)]);
    expect(cardsOf(g, 'p2', 'trash')).toEqual([ROUGE]);
  });

  it("[Trigger]: activates this card's [Main] effect", () => {
    const g = damageWith(ID, { characters: [SHC.franky4] });
    g.act({ type: 'trigger', activate: true });
    expectDecision(g, 'choose', 'p1');
    const attacker = g.find('p2', 'characters', V.c7);
    pick(g, [attacker]);
    expect(g.power(attacker)).toBe(4000);
    // 4000 power: nothing to K.O. (2000 or less), so the effect ends.
    expect(cardsOf(g, 'p2', 'trash')).toEqual([]);
    expect(cardsOf(g, 'p1', 'trash')).toEqual([ID]);
  });
});
