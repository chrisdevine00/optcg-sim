import type { CardScript } from '../../src/dsl.ts';

/** EB04-035 Hitokiri Kamazo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_035: CardScript = {
  cardId: 'EB04-035',
  textHash: '167c76baed331b',
  verified: {
    source: 'cards/overrides/EB04-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'don-returned',
      label:
        'Your turn, once per turn: when your DON!! is returned to the DON!! deck, with a {Kid Pirates} Leader add up to 1 DON!! rested',
      kind: 'auto',
      oncePerTurn: true,
      when: [
        {
          event: 'donReturned',
          owner: 'you',
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
        {
          leader: {
            type: 'Kid Pirates',
          },
        },
      ],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
