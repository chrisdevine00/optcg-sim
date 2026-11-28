import type { CardScript } from '../../src/dsl.ts';

/** OP18-099 Kaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_099: CardScript = {
  cardId: 'OP18-099',
  textHash: '14e3725770d439',
  verified: {
    source: 'cards/overrides/OP18-099.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Add up to 1 card with a type including "CP" from your hand to the top or bottom of your Life cards face-up',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
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
        'If your Leader\'s type includes "CP", draw 1 card and place up to 1 Character with a cost of 8 or less at the bottom of the owner\'s deck',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            { do: { draw: 1 } },
            {
              do: {
                move: {
                  what: {
                    from: 'characters',
                    owner: 'any',
                    filter: { cost: { lte: 8 } },
                    pick: { upTo: 1 },
                  },
                  to: { zone: 'deck', position: 'bottom' },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'OP-18 wave G3: the controller picks the Life end; the card arrives face-up (public), no [Trigger]',
    '"a Character" in the [Trigger] is either player\'s (OP17-046 reading)',
  ],
};
