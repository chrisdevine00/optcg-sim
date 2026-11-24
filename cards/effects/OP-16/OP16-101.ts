import type { CardScript } from '../../src/dsl.ts';

/** OP16-101 Mahoroba. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_101: CardScript = {
  cardId: 'OP16-101',
  textHash: '1b12aa2e594a0d',
  verified: {
    source: 'cards/overrides/OP16-101.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Up to 1 of your Leader or Characters gains +3000 power during this turn; then, with 10 or more cards in your trash, K.O. a cost 2 or less Character',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
        {
          if: { cmp: [{ trash: 'you' }, '>=', 10] },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 2 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Add up to 1 [Yamato] from your trash to your hand',
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: { from: 'trash', owner: 'you', filter: { name: 'Yamato' }, pick: { upTo: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, if" is a separate condition checked after the power step; it does not depend on a Leader or Character having been chosen, and the trash count is read at that moment (the Event itself is already in the trash)',
  ],
};
