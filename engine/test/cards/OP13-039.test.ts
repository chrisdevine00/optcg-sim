/** OP13-039 Gum-Gum Snake Shot. */
import { describe, expect, it } from 'vitest';
import { endCounter, pick, PLAIN_BLUE, takeDamage } from './helpers.ts';
import {
  canPick,
  cardsOf,
  counterStep,
  expectDecision,
  mk,
  triggerGame,
  useCounter,
  V,
} from './helpers-op13g2.ts';

const ID = 'OP13-039';
const rested = (card: string) => ({ card, rested: true });

describe('OP13-039 Gum-Gum Snake Shot', () => {
  const battle = (p2Chars: unknown[]) =>
    counterStep(
      { leader: PLAIN_BLUE, hand: [ID], costArea: { active: 2, rested: 0 } },
      { characters: p2Chars as string[] },
    );

  it("[Counter]: K.O.s up to 1 of the opponent's rested Characters with a cost of 4 or less (boundary 4)", () => {
    const g = battle([rested(V.c4), rested(V.c5), V.c3]);
    useCounter(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c5))).toBe(false); // cost 5
    expect(canPick(g, g.find('p2', 'characters', V.c3))).toBe(false); // active
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).not.toContain(V.c4);
    expect(cardsOf(g, 'p2', 'trash')).toContain(V.c4);
  });

  it('must not offer an active Character of cost 7 (the attacker) nor your own rested Characters', () => {
    const g = counterStep(
      {
        leader: PLAIN_BLUE,
        hand: [ID],
        characters: [rested(V.c1)],
        costArea: { active: 2, rested: 0 },
      },
      { characters: [V.c2] },
    );
    useCounter(g, ID);
    expect(canPick(g, g.find('p2', 'characters', V.c7))).toBe(false);
    expect(canPick(g, g.find('p1', 'characters', V.c1))).toBe(false);
  });

  it('with no legal target the Counter resolves without a choice', () => {
    const g = battle([V.c3]);
    useCounter(g, ID);
    endCounter(g);
    takeDamage(g);
    expect(cardsOf(g, 'p2', 'characters')).toContain(V.c3);
  });

  it('[Trigger]: activates the [Counter] effect outside a battle (K.O. a rested cost 4 or less)', () => {
    const g = triggerGame(ID, { costArea: { active: 0, rested: 3 } }, [rested(V.c4), V.c2]);
    g.act({ type: 'trigger', activate: true });
    expect(canPick(g, g.find('p2', 'characters', V.c4))).toBe(true);
    expect(canPick(g, g.find('p2', 'characters', V.c2))).toBe(false);
    pick(g, [g.find('p2', 'characters', V.c4)]);
    expect(cardsOf(g, 'p2', 'characters')).not.toContain(V.c4);
  });

  it('is not playable from hand in the Main Phase (it has no [Main])', () => {
    const g = mk({ hand: [ID] });
    expect(g.legal().some((a) => a.type === 'playCard')).toBe(false);
  });
});
