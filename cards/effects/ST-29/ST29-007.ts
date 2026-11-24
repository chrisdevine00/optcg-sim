import type { CardScript } from '../../src/dsl.ts';

/** ST29-007 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_007: CardScript = {
  cardId: 'ST29-007',
  textHash: '0e6721e3b0ffea',
  verified: {
    source: 'cards/overrides/ST29-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'You may add 1 card from the top or bottom of your Life cards to your hand: add up to 1 card from your hand to the top of your Life cards',
      kind: 'auto',
      when: ['onKO'],
      cost: [{ lifeToHand: { from: 'topOrBottom', n: 1 } }],
      effect: [
        {
          do: {
            move: {
              what: { from: 'hand', owner: 'you', pick: { upTo: 1 } },
              to: { zone: 'life', position: 'top' },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Up to 1 of your [Monkey.D.Luffy] cards gains +2000 power during this turn',
      kind: 'trigger',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Monkey.D.Luffy' },
                pick: { upTo: 1 },
              },
              amount: 2000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the card taken from Life is in the hand when "up to 1 card from your hand" is chosen, so it may be put straight back (face-down, on top); the cost is not damage, so no [Trigger]',
    'reading: "[Monkey.D.Luffy] cards" are the Leader and Characters with that name (the only cards that can gain power)',
  ],
};
