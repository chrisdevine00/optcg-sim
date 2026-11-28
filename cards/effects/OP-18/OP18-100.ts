import type { CardScript } from '../../src/dsl.ts';

/** OP18-100 Kalifa. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_100: CardScript = {
  cardId: 'OP18-100',
  textHash: '04c39311165b4d',
  verified: {
    source: 'cards/overrides/OP18-100.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 1 card, then add up to 1 card with a type including "CP" from your hand to the top or bottom of your Life cards face-up',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            move: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { typeIncludes: 'CP' },
                pick: { upTo: 1 },
              },
              to: { zone: 'life', position: 'topOrBottom', faceUp: true },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", draw 1 card and rest up to 1 of your opponent\'s Leader or Characters',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                rest: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: ['OP-18 wave G3: the controller picks the Life end; the card arrives face-up'],
};
