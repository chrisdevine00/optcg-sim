import type { CardScript } from '../../src/dsl.ts';

/** OP17-092 Brogy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_092: CardScript = {
  cardId: 'OP17-092',
  textHash: '109335073523e2',
  verified: {
    source: 'cards/overrides/OP17-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-up',
      label: 'This Character gains +12 cost',
      kind: 'permanent',
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: 12 } }],
    },
    {
      id: 'on-play',
      label:
        'With an {Elbaph} Leader, play up to 1 [Dorry] with a cost of 5 or less from your hand or trash; then you cannot play Character cards this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { leader: { type: 'Elbaph' } },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: ['hand', 'trash'],
                    owner: 'you',
                    filter: { all: [{ name: 'Dorry' }, { cost: { lte: 5 } }] },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
            {
              do: {
                restrict: {
                  target: 'you',
                  what: { cannotPlay: { category: ['Character'] } },
                  duration: 'thisTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'QA-OP17 OP17-085 via RL-43: the +12 cost applies only on the field, so the [Dorry] in hand or trash is judged by its printed cost 5',
    'reading (audit Q10): "Then, you cannot play Character cards" is inside the Leader-type "if" and is not gated on a card having been played',
  ],
};
