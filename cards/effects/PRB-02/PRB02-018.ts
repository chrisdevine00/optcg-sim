import type { CardScript } from '../../src/dsl.ts';

/** PRB02-018 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_018: CardScript = {
  cardId: 'PRB02-018',
  textHash: '165723fb06b7e0',
  verified: {
    source: 'cards/overrides/PRB02-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have a face-up Life card, play up to 1 [Sabo], [Portgas.D.Ace] or [Monkey.D.Luffy] with a cost of 2 from your hand or trash',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: { cmp: [{ lifeFaceUp: 'you' }, '>=', 1] },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: ['hand', 'trash'],
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { cost: { eq: 2 } },
                        {
                          any: [
                            { name: 'Sabo' },
                            { name: 'Portgas.D.Ace' },
                            { name: 'Monkey.D.Luffy' },
                          ],
                        },
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
    'reading: "If you have a face-up Life card" follows no colon: an effect condition read when the effect resolves; the face state of a Life card is public (G41)',
    'reading: the cost of 2 applies to each of the three names; one card is played, from the hand or the trash',
  ],
};
