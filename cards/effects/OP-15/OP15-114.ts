import type { CardScript } from '../../src/dsl.ts';

/** OP15-114 Wyper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_114: CardScript = {
  cardId: 'OP15-114',
  textHash: '1115f93684a234',
  verified: {
    source: 'cards/overrides/OP15-114.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Turn 1 Life card face-up: all your opponent's Characters get -2000 power this turn; K.O. their Characters with 0 power or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ turnLifeFaceUp: 1 }],
      effect: [
        {
          do: {
            power: {
              target: { from: 'characters', owner: 'opponent' },
              amount: -2000,
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { power: { lte: 0 } },
            },
          },
        },
      ],
    },
    {
      id: 'give-don',
      label: 'Give up to 1 rested DON!! to 1 of your {Sky Island} Leader or Characters',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          do: {
            giveDon: {
              n: 1,
              state: 'rested',
              to: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { type: 'Sky Island' },
                pick: { exactly: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'The K.O. checks the power after the -2000 (printed, DON!! and other modifiers all count), so Characters already at 2000 or less die, and so do those with a prior negative modifier',
    'The K.O. clause is part of the same effect: it is skipped if the Life cost was not paid',
  ],
};
