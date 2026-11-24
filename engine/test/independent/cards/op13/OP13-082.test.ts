/**
 * OP13-082 Five Elders (Character, Black, cost 10, 12000, no Counter, {Celestial Dragons}/{Five Elders}).
 *
 * Card text: "[Activate: Main] If your Leader is [Imu], you may rest 1 of your DON!! cards and trash 1 card
 * from your hand: Trash all of your Characters and play up to 5 "Five Elders" type Character cards
 * with 5000 power and different card names from your trash."
 *
 * Rules: CR 8-4-1 (the activation procedure checks conditions first, then pays the costs), CR 8-3-1-3
 * (an unpayable cost), CR 8-3-1-4 ("you may" cost), CR 4-8-1 ("up to"), a trash is not a K.O.
 * (RL-15), a card played by an effect pays no cost and its [On Play] activates, power is the printed
 * power for a card in the trash.
 * Leaders: OP13-079 Imu; ST01-001 Luffy (not [Imu]).
 * Scenery: OP13-080 Nusjuro (Five Elders, 5000, inert), OP13-089 Warcury (Five Elders, 5000, [On K.O.]
 * only), OP13-091 Mars (Five Elders, 5000, [On Play] may trash 1: K.O. base cost 5 or less),
 * OP01-023 Marco (not a Five Elders).
 */
import { describe, expect, it } from 'vitest';
import {
  at,
  atMain,
  ch,
  chars,
  decision,
  don,
  hand,
  LD13,
  me,
  need,
  no,
  offeredAbilities,
  offeredIds,
  pickInst,
  reachablePickSets,
  S13,
  trash,
  tryActivate,
  useAbility,
  junk,
  none,
  type PlayerSpec,
} from './kit-op13c.ts';
import type { TestGame } from '../../../fixtures/index.ts';
import type { CardId } from '@optcg/engine';

const ID = 'OP13-082';
const NUS = S13.nusjuro;
const WAR = S13.warcury;
const MARS = 'OP13-091';
const COST_CARD = S13.c4;

function start(
  o: {
    leader?: string;
    chars?: PlayerSpec['characters'];
    trash?: CardId[];
    hand?: CardId[];
    active?: number;
    rested?: number;
    theirs?: PlayerSpec['characters'];
  } = {},
): TestGame {
  return me(
    o.leader ?? LD13.imu,
    {
      characters: [ID, ...(o.chars ?? [])],
      trash: o.trash ?? [NUS, NUS, WAR],
      hand: o.hand ?? [COST_CARD],
      costArea: { active: o.active ?? 3, rested: o.rested ?? 0 },
      deck: Array.from({ length: 10 }, () => S13.filler),
    },
    { characters: o.theirs ?? [] },
  );
}

/** Activate and pay: the cost pick from hand is asked only when several cards could be trashed. */
function activate(g: TestGame, pay: CardId = COST_CARD): void {
  useAbility(g, at(g, 'p1', 'characters', ID));
  const d = decision(g);
  if (d?.kind === 'choose' && d.purpose === 'cost') pickInst(g, [at(g, 'p1', 'hand', pay)]);
}

describe('OP13-082 Five Elders [Activate: Main]: with an [Imu] Leader, rest 1 DON!! and trash 1 card: trash all my Characters, play up to 5', () => {
  it('pays the cost, trashes ALL my Characters (itself included) and plays the chosen Five Elders from the trash', () => {
    const g = start({ chars: [S13.c3] });
    const before = don(g);
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', NUS), at(g, 'p1', 'trash', WAR)]);
    expect(atMain(g)).toBe(true);
    expect(chars(g)).toEqual([NUS, WAR].sort());
    expect(trash(g)).toEqual([ID, S13.c3, NUS, COST_CARD].sort());
    expect(hand(g)).toEqual([]);
    expect(don(g)).toMatchObject({ active: before.active - 1, rested: before.rested + 1 });
  });

  it('different card names: two copies of the same name can never both be played', () => {
    const g = start();
    activate(g);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    for (const s of sets) {
      const names = s.split('+').filter(Boolean);
      expect(new Set(names).size).toBe(names.length);
    }
    expect(sets.has([NUS, WAR].sort().join('+'))).toBe(true);
    expect(sets.has(`${NUS}+${NUS}`)).toBe(false);
  });

  it('only Five Elders with 5000 power: the Five Elders itself (12000), a non-Five Elders and the hand card are not offered', () => {
    const g = start({ chars: [S13.c3] });
    activate(g);
    need(g, 'choose', 'p1');
    const offered = offeredIds(g);
    expect(offered).not.toContain(ID);
    expect(offered).not.toContain(S13.c3);
    expect(offered).not.toContain(COST_CARD);
    expect(new Set(offered)).toEqual(new Set([NUS, WAR]));
  });

  it('"up to 5": may play none, one or two (all reachable)', () => {
    const g = start();
    activate(g);
    need(g, 'choose', 'p1');
    const sets = reachablePickSets(g);
    expect(sets.has('')).toBe(true);
    expect(sets.has(NUS)).toBe(true);
    expect(sets.has(WAR)).toBe(true);
  });

  it('playing none still trashes every Character (the trash is not undone)', () => {
    const g = start({ chars: [S13.c3] });
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(ID);
    expect(trash(g)).toContain(S13.c3);
  });

  it('at most 5 can be played: with 5 differently named candidates the pick allows 5', () => {
    const g = start({
      trash: [NUS, 'OP13-083', 'OP13-084', WAR, MARS, NUS],
    });
    activate(g);
    expect(decision(g)?.max).toBe(5);
  });

  it('a card played this way activates its [On Play]: Mars asks whether to pay its cost', () => {
    const g = start({ trash: [MARS], hand: [COST_CARD, S13.c5], theirs: [S13.c3] });
    activate(g);
    need(g, 'choose', 'p1');
    pickInst(g, [at(g, 'p1', 'trash', MARS)]);
    need(g, 'optional', 'p1');
    no(g, 'p1');
    expect(chars(g)).toEqual([MARS]);
  });

  it('only my Characters are trashed: the opponent’s stay', () => {
    const g = start({ theirs: [S13.c3] });
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g, 'p2')).toEqual([S13.c3]);
  });

  it('my own effect also trashes a Character that cannot be removed by the opponent’s effects (Nusjuro with 7+ in the trash)', () => {
    const g = start({ chars: [NUS], trash: junk(7) });
    activate(g);
    need(g, 'choose', 'p1');
    none(g);
    expect(chars(g)).toEqual([]);
    expect(trash(g)).toContain(NUS);
  });

  it('the condition: with a Leader that is not [Imu] the ability is not offered and nothing changes', () => {
    const g = start({ leader: LD13.plain, chars: [S13.c3] });
    expect(offeredAbilities(g, at(g, 'p1', 'characters', ID))).toEqual([]);
    expect(chars(g)).toEqual([ID, S13.c3].sort());
    expect(hand(g)).toEqual([COST_CARD]);
  });

  it('CR 8-3-1-3: with an empty hand the cost cannot be paid and nothing is trashed', () => {
    const g = start({ hand: [], chars: [S13.c3] });
    expect(tryActivate(g, ch(g, 'p1', ID))).toBe(false);
    expect(chars(g)).toEqual([ID, S13.c3].sort());
  });

  it('CR 8-3-1-3: with no active DON!! to rest the cost cannot be paid', () => {
    const g = start({ active: 0, rested: 3, chars: [S13.c3] });
    expect(tryActivate(g, ch(g, 'p1', ID))).toBe(false);
    expect(chars(g)).toEqual([ID, S13.c3].sort());
    expect(hand(g)).toEqual([COST_CARD]);
  });
});
