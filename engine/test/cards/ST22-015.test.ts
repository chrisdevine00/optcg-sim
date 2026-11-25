/** ST22-015 I Am Whitebeard!!. */
import { describe, expect, it } from 'vitest';
import { accept, dec, decline, expectDecision, hand, none, option, pick, play } from './helpers.ts';
import { EDWARD, mk, OTHER_LEADER, times, V, WB4, WB_LEADER } from './helpers-lfb.ts';

const ID = 'ST22-015';

describe('ST22-015 I Am Whitebeard!!', () => {
  const start = (
    handCards: string[] = [EDWARD, V.c1],
    leader: string = WB_LEADER,
    life: string[] = times(3, V.c2),
  ) => mk({ leader, hand: [ID, ...handCards] as never, life: life as never });
  const chars = (g: ReturnType<typeof start>) => g.zone('p1', 'characters').map((c) => c.card);

  /** Answer the first prompts: the play of [Edward.Newgate], then the Life `may`. */
  const playEdward = (g: ReturnType<typeof start>) => {
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    pick(g, [g.find('p1', 'hand', EDWARD)]);
  };

  it("[Main]: with a {Whitebeard Pirates} Leader, play [Edward.Newgate]; you may add a Life card to your hand: your Leader gains +2000 power until the end of your opponent's next turn", () => {
    const g = start();
    playEdward(g);
    expect(chars(g)).toEqual([EDWARD]);
    expectDecision(g, 'optional', 'p1');
    accept(g);
    // The top or the bottom card.
    expectDecision(g, 'choose', 'p1');
    option(
      g,
      g
        .legal()
        .flatMap((a) =>
          a.type === 'pick' && typeof a.choice === 'object' && 'option' in a.choice
            ? [a.choice.option]
            : [],
        )[0]!,
    );
    if (dec(g)?.kind === 'choose') pick(g, [g.leader('p1')]);
    expect(g.life('p1')).toBe(2);
    expect(hand(g, 'p1')).toEqual([V.c1, V.c2]);
    expect(g.power(g.leader('p1'))).toBe(7000);
  });

  it('declining the Life card: no card added and no power', () => {
    const g = start();
    playEdward(g);
    decline(g);
    expect(g.life('p1')).toBe(3);
    expect(g.power(g.leader('p1'))).toBe(5000);
  });

  it('"up to 1": the play may be declined and the Life step is still offered ("Then")', () => {
    const g = start();
    play(g, ID);
    none(g);
    expect(chars(g)).toEqual([]);
    expectDecision(g, 'optional', 'p1');
  });

  it('only a card named [Edward.Newgate] can be played', () => {
    const g = start([V.c1, WB4]);
    play(g, ID);
    expectDecision(g, 'choose', 'p1');
    expect(g.legal().filter((a) => a.type === 'pick')).toHaveLength(0);
  });

  it('must not fire: with a Leader that is not {Whitebeard Pirates} nothing happens (no play, no Life step)', () => {
    const g = start([EDWARD, V.c1], OTHER_LEADER);
    play(g, ID);
    expect(dec(g)?.kind).toBe('main');
    expect(chars(g)).toEqual([]);
    expect(hand(g, 'p1')).toEqual([EDWARD, V.c1]);
    expect(g.life('p1')).toBe(3);
  });

  it('with no Life cards the Life step is skipped', () => {
    const g = start([EDWARD], WB_LEADER, []);
    playEdward(g);
    expect(dec(g)?.kind).toBe('main');
    expect(g.power(g.leader('p1'))).toBe(5000);
  });
});
