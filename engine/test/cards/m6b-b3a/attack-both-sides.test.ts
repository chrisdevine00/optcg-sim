/**
 * Planted: an `attack` timing that names both `attacker` and `target` fires only when both match
 * (BACKLOG §5, OP12-081 "When this Leader attacks your opponent's Leader"). Checked from the
 * attacking side and from the attacked side.
 */
import { describe, expect, it } from 'vitest';
import { withAbilities, type Ability } from '../../../src/testing.ts';
import { endCounter, game, hand, passBlock, PLAIN_BLUE, PLAIN_PURPLE, V } from '../helpers.ts';

const drawOn = (when: unknown): Ability[] =>
  [
    { id: 'planted', label: 'planted draw', kind: 'auto', when, effect: [{ do: { draw: 1 } }] },
  ] as unknown as Ability[];

describe('attack timing with both attacker and target', () => {
  it('attacking side: Leader attacks the opposing Leader fires; Leader attacks a Character does not', () => {
    const when = [
      {
        event: 'attack',
        attacker: { from: 'leader', owner: 'you' },
        target: { from: 'leader', owner: 'opponent' },
      },
    ];
    {
      const owner = PLAIN_PURPLE;
      const g = game(
        { leader: PLAIN_PURPLE, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }] },
      );
      g.state = withAbilities(g.state, owner, drawOn(when));
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
      expect(hand(g, 'p1')).toHaveLength(1);
    }
    {
      const owner = PLAIN_PURPLE;
      const g = game(
        { leader: PLAIN_PURPLE, costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE, characters: [{ card: V.c1, rested: true }] },
      );
      g.state = withAbilities(g.state, owner, drawOn(when));
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.find('p2', 'characters', V.c1) });
      passBlock(g);
      endCounter(g);
      expect(hand(g, 'p1')).toHaveLength(0);
    }
  });

  it('attacked side: "when your Leader is attacked by a Character" ignores an attack by a Leader', () => {
    const when = [
      {
        event: 'attack',
        target: { from: 'leader', owner: 'you' },
        attacker: { from: 'characters', owner: 'opponent' },
      },
    ];
    {
      const owner = PLAIN_BLUE;
      const g = game(
        { leader: PLAIN_PURPLE, characters: [V.c1], costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE },
        { turn: 3 },
      );
      g.state = withAbilities(g.state, owner, drawOn(when));
      g.act({ type: 'attack', attacker: g.leader('p1'), target: g.leader('p2') });
      expect(hand(g, 'p2')).toHaveLength(0);
    }
    {
      const owner = PLAIN_BLUE;
      const g = game(
        { leader: PLAIN_PURPLE, characters: [V.c1], costArea: { active: 5, rested: 0 } },
        { leader: PLAIN_BLUE },
        { turn: 3 },
      );
      g.state = withAbilities(g.state, owner, drawOn(when));
      g.act({ type: 'attack', attacker: g.find('p1', 'characters', V.c1), target: g.leader('p2') });
      expect(hand(g, 'p2')).toHaveLength(1);
    }
  });
});
