import type { CardScript } from '../../src/dsl.ts';

/** OP13-002 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_002: CardScript = {
  cardId: 'OP13-002',
  textHash: '1a7c1e087b629d',
  verified: {
    source: 'cards/overrides/OP13-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-attack',
      label:
        "Once per turn, you may trash 1 card from your hand: give up to 1 of your opponent's Leader or Character cards -2000 power during this battle",
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            power: {
              target: { from: ['leader', 'characters'], owner: 'opponent', pick: { upTo: 1 } },
              amount: -2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'draw',
      label:
        "[DON!! x1] Once per turn, when you take damage or your Character with 6000 base power or more is K.O.'d, draw 1 card",
      kind: 'auto',
      when: [
        { event: 'damageTaken', owner: 'you' },
        {
          event: 'koed',
          filter: { all: [{ category: ['Character'] }, { basePower: { gte: 6000 } }] },
        },
      ],
      conditions: [{ donGiven: 1 }],
      oncePerTurn: true,
      effect: [{ do: { draw: 1 } }],
    },
  ],
  rulings: [
    'reading (G43, M6b-Q66): "when you take damage" is one event per damage, fired once its processing (the [Trigger] included) has ended, so a Double Attack is one event; the two timings share one Once Per Turn',
    'reading: "base power of 6000 or more" is the printed power, so a Character buffed to 6000 does not count and one debuffed below 6000 still does; a K.O. of any cause counts',
  ],
};
