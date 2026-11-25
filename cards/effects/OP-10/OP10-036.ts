import type { CardScript } from '../../src/dsl.ts';

/** OP10-036 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_036: CardScript = {
  cardId: 'OP10-036',
  textHash: '16869f3c85c44f',
  verified: {
    source: 'cards/overrides/OP10-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        'Your turn, once per turn: when a Character is rested by your effect, set up to 1 DON!! as active',
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'rested',
          owner: 'any',
          filter: {
            category: ['Character'],
          },
          by: 'yourEffect',
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            setActive: {
              from: 'donCostArea',
              owner: 'you',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q30, open): "rested by your effect" counts a Character of either player rested by an effect of yours; a rest paid as a cost, an attack or a block does not count. The Once Per Turn is spent by the first such rest, whether or not a DON!! can be set active',
  ],
};
