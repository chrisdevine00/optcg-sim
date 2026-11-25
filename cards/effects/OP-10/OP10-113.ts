import type { CardScript } from '../../src/dsl.ts';

/** OP10-113 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_113: CardScript = {
  cardId: 'OP10-113',
  textHash: '1cd8129bd3bd22',
  verified: {
    source: 'cards/overrides/OP10-113.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With less Life cards than your opponent, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<',
            {
              life: 'opponent',
            },
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'You may trash 1 card from your hand: if your Leader has the {Supernovas} type, play this card',
      kind: 'trigger',
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
          if: {
            leader: {
              type: 'Supernovas',
            },
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'self',
                    owner: 'you',
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
    'reading: the "If your Leader has the Supernovas type" is after the colon: the optional hand-trash cost is paid first and the play does nothing when the Leader does not match (the trash is lost)',
    'reading: [Rush] is a permanent grant read from the Life counts as they stand, so it is gained and lost as Life changes; equal Life gives no Rush',
  ],
};
