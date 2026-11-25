import type { CardScript } from '../../src/dsl.ts';

/** OP10-087 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_087: CardScript = {
  cardId: 'OP10-087',
  textHash: '026ccda8750992',
  verified: {
    source: 'cards/overrides/OP10-087.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      label:
        'Rest this Character and 1 of your Dressrosa Leader or Stage: if your opponent has 5 or more cards in hand, they trash 1; then trash 2 cards from the top of your deck',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'opponent',
              },
              '>=',
              5,
            ],
          },
          then: [
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'opponent',
                  chooser: 'opponent',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
            {
              do: {
                mill: {
                  player: 'you',
                  n: 2,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (M4b-5): "Then, trash 2 cards from the top of your deck" follows the "If your opponent has 5 or more cards" sentence, so it sits inside the guard: with 4 or fewer cards in their hand nothing is trashed from your deck',
  ],
};
