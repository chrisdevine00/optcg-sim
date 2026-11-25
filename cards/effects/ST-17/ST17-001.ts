import type { CardScript } from '../../src/dsl.ts';

/** ST17-001 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST17_001: CardScript = {
  cardId: 'ST17-001',
  textHash: '1e1963b17620b3',
  verified: {
    source: 'cards/overrides/ST17-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Reveal 1 from the top of your deck; if it is a "The Seven Warlords of the Sea" card, draw 2 and place 1 card from your hand at the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { reveal: { from: 'deckTop', n: 1, bind: 'revealed' } } },
        {
          if: { ref: 'revealed', matches: { type: 'The Seven Warlords of the Sea' } },
          then: [
            { do: { draw: 2 } },
            {
              do: {
                move: {
                  what: { from: 'hand', owner: 'you', pick: { exactly: 1 } },
                  to: { zone: 'deck', position: 'top' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'RL-44: a hit draws the revealed card; a miss leaves it on top. "place 1 card from your hand at the top" is mandatory when the hit happens (the card drawn may be the one placed back)',
  ],
};
