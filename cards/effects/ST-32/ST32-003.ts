import type { CardScript } from '../../src/dsl.ts';

/** ST32-003 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST32_003: CardScript = {
  cardId: 'ST32-003',
  textHash: '1a57d2d1f8e873',
  verified: {
    source: 'cards/overrides/ST32-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        'Your turn: when this Character becomes rested, draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: [{ event: 'rested', owner: 'you', filter: { isSelf: true } }],
      conditions: [{ yourTurn: true }],
      effect: [
        { do: { draw: 1 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
    {
      id: 'on-play',
      label:
        'If your Leader has the <Slash> attribute, play up to 1 Character with a cost of 5 or less that is [Perona] or has the <Slash> attribute from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              { leader: { attribute: 'Slash' } },
              {
                exists: {
                  from: 'hand',
                  owner: 'you',
                  filter: {
                    all: [
                      { category: ['Character'] },
                      { cost: { lte: 5 } },
                      { any: [{ name: 'Perona' }, { attribute: 'Slash' }] },
                    ],
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { cost: { lte: 5 } },
                        { any: [{ name: 'Perona' }, { attribute: 'Slash' }] },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M6b-Q30, Q41): "becomes rested" counts every cause (an attack, a cost, an effect, either player\'s) as long as it is your turn; "draw 1 and trash 1" is not optional and the trash is exactly 1',
  ],
};
