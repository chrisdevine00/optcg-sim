import type { CardScript } from '../../src/dsl.ts';

/** OP17-053 Barbell. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_053: CardScript = {
  cardId: 'OP17-053',
  textHash: '00d12ef37a8fe3',
  verified: {
    source: 'cards/overrides/OP17-053.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Your opponent places 2 cards from their hand at the bottom of their deck',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'opponent',
                chooser: 'opponent',
                pick: {
                  exactly: 2,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
    {
      id: 'boost',
      label:
        'You may trash 1 card from your hand: this Character gains +3000 power during this turn',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'self',
                owner: 'you',
              },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: with fewer than 2 cards in hand the opponent places all they have'],
};
