import type { CardScript } from '../../src/dsl.ts';

/** ST34-004 Charlotte Linlin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST34_004: CardScript = {
  cardId: 'ST34-004',
  textHash: '08515f4b60c8a8',
  verified: {
    source: 'cards/overrides/ST34-004.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Add up to 1 card to your Life; then up to 1 of your opponent's Characters' base power becomes 0",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 4,
        },
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
            move: {
              what: {
                from: 'deckTop',
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'life',
                position: 'top',
              },
            },
          },
        },
        {
          do: {
            setBasePower: {
              target: {
                from: 'characters',
                owner: 'opponent',
                pick: {
                  upTo: 1,
                },
              },
              value: 0,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'QA-ST34 ST34-004: as the only card in hand it cannot pay, so nothing resolves; the highest base power applies',
  ],
};
