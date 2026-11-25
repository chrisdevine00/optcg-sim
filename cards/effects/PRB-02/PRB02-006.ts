import type { CardScript } from '../../src/dsl.ts';

/** PRB02-006 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_006: CardScript = {
  cardId: 'PRB02-006',
  textHash: '1130dd3453c370',
  verified: {
    source: 'cards/overrides/PRB02-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'rest-shield',
      label:
        "Opponent's Turn: instead of this Character being rested by your opponent's Character's effect, you may rest 1 of your other Characters",
      kind: 'replacement',
      conditions: [{ opponentsTurn: true }],
      replaces: {
        rest: { from: 'characters', owner: 'you', filter: { isSelf: true } },
        cause: 'opponentCharacterEffect',
      },
      optional: true,
      instead: [
        {
          rest: {
            from: 'characters',
            owner: 'you',
            filter: { all: [{ not: { isSelf: true } }, { state: 'active' }] },
            pick: { exactly: 1 },
          },
        },
      ],
    },
  ],
  rulings: [
    'G37 (wave 4): only a rest by an effect whose source is an opponent Character; a Leader, Stage or Event effect, a rest paid as a cost and your own effects are not covered',
    'reading: the other Character must be active (an already rested Character cannot be rested again)',
  ],
};
