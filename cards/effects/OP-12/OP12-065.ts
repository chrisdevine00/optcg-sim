import type { CardScript } from '../../src/dsl.ts';

/** OP12-065 Emporio.Ivankov. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_065: CardScript = {
  cardId: 'OP12-065',
  textHash: '177a38675e0cda',
  verified: {
    source: 'cards/overrides/OP12-065.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With 4 or more Events in your trash, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
            '>=',
            4,
          ],
        },
      ],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Blocker' } }],
    },
    {
      id: 'on-ko',
      label: 'Add up to 1 Event from your trash to your hand',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: { category: ['Event'] },
                pick: { upTo: 1 },
              },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
  ],
};
