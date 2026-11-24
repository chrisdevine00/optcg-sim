import type { CardScript } from '../../src/dsl.ts';

/** OP16-104 Catarina Devon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_104: CardScript = {
  cardId: 'OP16-104',
  textHash: '0d0486808bbfeb',
  verified: {
    source: 'cards/overrides/OP16-104.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "Select up to 1 of your opponent's Characters: this Character's base power becomes the same as its power during this turn",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: { select: { from: 'characters', owner: 'opponent', pick: { upTo: 1 }, bind: 'sel' } },
        },
        {
          if: { exists: { from: 'characters', owner: 'opponent', filter: { ref: 'sel' } } },
          then: [
            {
              do: {
                setBasePower: {
                  target: { from: 'self', owner: 'you' },
                  value: { refStat: 'sel', stat: 'power' },
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'Draw 1 and play up to 1 {Blackbeard Pirates} Character with a cost of 1 from your trash',
      kind: 'trigger',
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    { category: ['Character'] },
                    { type: 'Blackbeard Pirates' },
                    { cost: { eq: 1 } },
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
  rulings: [
    "reading: the selected Character's power (with its modifiers) is read when the effect resolves and fixed as this Character's base power for the turn (no ruling on later changes); with no selection nothing changes",
  ],
};
