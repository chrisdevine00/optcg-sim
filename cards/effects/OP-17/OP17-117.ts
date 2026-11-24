import type { CardScript } from '../../src/dsl.ts';

/** OP17-117 Maser Saber. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_117: CardScript = {
  cardId: 'OP17-117',
  textHash: '0cc3b46bab3135',
  verified: {
    source: 'cards/overrides/OP17-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label: 'Up to 1 of your [Charlotte Linlin] gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: { name: 'Charlotte Linlin' },
                pick: { upTo: 1 },
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        "Your opponent may trash 3 cards from their hand; if they do not, K.O. up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'trigger',
      effect: [
        {
          if: { cmp: [{ hand: 'opponent' }, '>=', 3] },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      trashFromHand: {
                        from: 'hand',
                        owner: 'opponent',
                        chooser: 'opponent',
                        pick: { exactly: 3 },
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      ko: {
                        from: 'characters',
                        owner: 'opponent',
                        filter: { cost: { lte: 6 } },
                        pick: { upTo: 1 },
                      },
                    },
                  },
                ],
              ],
              chooser: 'opponent',
              labels: [
                'Trash 3 cards from your hand',
                "Do not trash: the Event's player K.O.s up to 1 of your Characters with a cost of 6 or less",
              ],
              neutral: [
                "Maser Saber's opponent trashes 3 cards from their hand.",
                "Maser Saber's opponent does not trash: up to 1 of their Characters with a cost of 6 or less is K.O.'d.",
              ],
            },
          ],
          else: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: { cost: { lte: 6 } },
                  pick: { upTo: 1 },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'audit Q11 (proposed, no ruling): with fewer than 3 cards in hand the opponent cannot trash, so the K.O. happens; otherwise the opponent chooses between trashing 3 and the K.O. before the target is picked',
  ],
};
