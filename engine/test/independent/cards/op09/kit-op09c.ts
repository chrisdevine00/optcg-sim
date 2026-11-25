/**
 * Helpers for the OP-09 group-C independent card tests (OP09-075 .. OP09-111, the ones listed in
 * the group). Public API, frozen fixtures and the earlier kits only. Every answer helper accepts
 * ONE named kind of prompt and fails on anything else (see kit-op17b.ts), so a missing or extra
 * "up to" / "you may" prompt is caught. Cards are played with raw actions (`playRaw`). Scenery
 * stats are noted next to each constant; tests repeat the ones they rely on.
 */
import { describe, expect, it } from 'vitest';
import type { CardId, InstanceId, PlayerId, PlayerSpec } from '@optcg/engine';
import type { TestGame } from '../../../fixtures/index.ts';
import { act, attack, decision } from '../../helpers.ts';
import { canFinish, choices, donChoices, kind } from '../kit.ts';
import {
  activateTrigger,
  atMain,
  don,
  hand,
  hitLeader,
  need,
  offeredAbilities,
  theirs,
  trash,
} from '../op16/kit-op16b.ts';

export * from '../op16/kit-op16b.ts';

/** Leaders used as scenery. */
export const LD9 = {
  /** OP09-081 Marshall.D.Teach: Black, 5000, 5 Life, {Blackbeard Pirates}/{The Four Emperors}. Negates its owner's [On Play]; [Activate: Main] never used here. */
  bbp: 'OP09-081',
  /** ST02-001 Eustass"Captain"Kid: Green, 5000, 5 Life, {Kid Pirates}/{Supernovas}. [Activate: Main] only. */
  kid: 'ST02-001',
  /** ST01-001 Monkey.D.Luffy: Red, 5000, 5 Life, {Straw Hat Crew}/{Supernovas}. Vanilla: no relevant type, name is not Nico Robin. */
  luffy: 'ST01-001',
  /** ST09-001 Yamato: Yellow, 5000, 5 Life, {Land of Wano}. No relevant type. */
  neutral: 'ST09-001',
  /** OP05-002 Belo Betty: Red/Yellow, 5000, 4 Life, {Revolutionary Army}. [Activate: Main] only (never used here). */
  rev: 'OP05-002',
  /** ST29-001 Monkey.D.Luffy: Yellow, 5000, 6 Life, {Straw Hat Crew}/{The Four Emperors}/{Egghead}. [When Attacking] only. */
  egghead: 'ST29-001',
  /** OP09-062 Nico Robin: Purple/Yellow, 5000, 4 Life, {Straw Hat Crew}, named [Nico Robin]. [Banish]; [When Attacking] only. */
  robin: 'OP09-062',
  /** EB05-010 Nico Robin: Green/Yellow, 5000, 4 Life, {Straw Hat Crew}, named [Nico Robin]. Own effects need a Wisdom Character K.O.'d or an [Activate: Main]. */
  robin2: 'EB05-010',
  /** EB04-001 Jewelry Bonney: Red/Yellow, 5000, 4 Life, {Bonney Pirates}/{Egghead}. [Opponent's Turn] +2000 power with 1 or less Life. */
  bonney: 'EB04-001',
} as const;

/** Scenery Characters and cards with the stats the tests rely on. */
export const SC9 = {
  /** OP02-060 Mohji: Blue, cost 1, 3000, Counter +1000, {Buggy Pirates}. Vanilla filler. */
  mohji: 'OP02-060',
  /** OP01-010 Komachiyo: Red, cost 1, 3000, Counter +1000. Vanilla. */
  c1: 'OP01-010',
  /** OP01-012 Sai: Red, cost 2, 4000, Counter +1000. Vanilla. */
  c2: 'OP01-012',
  /** OP01-023 Marco: Red, cost 3, 5000, Counter +1000. Vanilla. */
  c3: 'OP01-023',
  /** OP01-018 Hajrudin: Red, cost 4, 6000, Counter +1000. Vanilla. */
  c4: 'OP01-018',
  /** OP02-006 Kingdew: Red, cost 5, 7000, Counter +1000. Vanilla. */
  c5: 'OP02-006',
  /** OP02-007 Thatch: Red, cost 6, 8000, Counter +1000. Vanilla. */
  c6: 'OP02-007',
  /** OP02-020 LittleOars Jr.: Red, cost 7, 9000, Counter +1000. Vanilla. */
  c7: 'OP02-020',
  /** OP12-005 Shiki: Red, cost 8, 10000, Counter +1000. Vanilla. */
  c8: 'OP12-005',
  /** OP01-104 Speed: Purple, cost 2, 3000, Counter +1000, "[Trigger] Play this card." */
  triggerSpeed: 'OP01-104',
  /** OP01-009 Carrot: Red, cost 2, 3000, Counter +1000, "[Trigger] Play this card." */
  triggerCarrot: 'OP01-009',
  /** ST05-007 Gordon: Purple, cost 1, 3000, Counter +1000, {FILM}. Vanilla; no [Trigger]. */
  gordon: 'ST05-007',
  /** OP06-094 Lola: Black, cost 4, 6000, Counter +1000, {Thriller Bark Pirates}. Vanilla. */
  tb4: 'OP06-094',
  /** OP14-109 Victoria Cindry: Yellow, cost 3, 1000, Counter +1000, {Thriller Bark Pirates}, [Blocker]. Cost 3: just above the limit of 2. */
  tb3: 'OP14-109',
  /** OP06-084 Jigoro of the Wind: Black, cost 2, 3000, Counter +1000, {Thriller Bark Pirates}. Only an [On K.O.] (inert when played). */
  tb2: 'OP06-084',
  /** OP14-102 Kumacy: Yellow, cost 1, 2000, Counter +2000, {Thriller Bark Pirates}. Vanilla (its text is a [Trigger]). */
  tb1: 'OP14-102',
  /** OP09-091 Vasco Shot: Black, cost 2, 2000, Counter +1000, {Blackbeard Pirates}, [Blocker]. */
  vasco: 'OP09-091',
  /** OP03-101 Camie: Yellow, cost 1, 3000, Counter +1000, {Merfolk}. Vanilla. */
  yc1: 'OP03-101',
  /** OP03-103 Bobbin the Disposer: Yellow, cost 2, 4000, Counter +1000, {Big Mom Pirates}. Vanilla. */
  yc2: 'OP03-103',
  /** OP03-111 Charlotte Praline: Yellow, cost 3, 5000, Counter +1000, {The Sun Pirates}/{Merfolk}. Vanilla. */
  yc3: 'OP03-111',
  /** OP03-106 Charlotte Opera: Yellow, cost 4, 6000, {Big Mom Pirates}. Vanilla (no [Trigger]). */
  yc4: 'OP03-106',
  /** OP12-103 Seto: Yellow, cost 5, 6000, Counter +2000, {Sky Island}/{Shandian Warrior}/{Jaya}. Vanilla. */
  yc5: 'OP12-103',
  /** EB05-041 Koala: Black, cost 2, 4000, Counter +1000, {Revolutionary Army}/{Dressrosa}. Vanilla. */
  ra2: 'EB05-041',
  /** OP05-012 Hack: Red, cost 3, 5000, Counter +1000, {Fish-Man}/{Revolutionary Army}. Vanilla. */
  ra3: 'OP05-012',
  /** OP12-083 Inazuma: Black, cost 5, 6000, Counter +2000, {Revolutionary Army}. Vanilla. */
  ra5: 'OP12-083',
  /** OP01-009 Carrot / OP01-104 Speed: Characters with a printed [Trigger]. */
  /** OP09-089 Stronger / OP09-090 Doc Q are cards under test; not scenery. */
} as const;

/** Play the card `card` of the deciding player's hand with raw actions: pay the play cost only. */
export function playRaw(g: TestGame, card: CardId): void {
  playInst(g, g.find(g.decider, 'hand', card));
}

/** Same, for an instance. */
export function playInst(g: TestGame, inst: InstanceId): void {
  const player: PlayerId = g.decider;
  act(g, { type: 'playCard', card: inst });
  for (let i = 0; i < 20; i++) {
    const d = decision(g);
    if (!d || d.kind !== 'choose' || d.player !== player || d.purpose !== 'cost') return;
    const pay = donChoices(g).find((o) => o.from === 'costActive');
    if (!pay) return;
    act(g, { type: 'pick', choice: pay });
  }
}

/** Instance of a Character of `who`. */
export function chr(g: TestGame, who: PlayerId, card: CardId, nth = 0): InstanceId {
  return g.find(who, 'characters', card, nth);
}

/** The ability ids offered on `card` now (Main Phase of the deciding player only). */
export function abil(g: TestGame, card: InstanceId): string[] {
  return offeredAbilities(g, card);
}

/** True if the Main Phase offers an [Activate: Main] on `card`. */
export function canAct(g: TestGame, card: InstanceId): boolean {
  expect(atMain(g, g.decider)).toBe(true);
  return abil(g, card).length > 0;
}

/** Activate the one ability on `card`; costs and targets are left pending. */
export function actRaw(g: TestGame, card: InstanceId): void {
  const [ability, ...more] = abil(g, card);
  if (!ability || more.length)
    throw new Error(`Expected exactly one ability: ${[ability, ...more]}`);
  act(g, { type: 'activate', card, ability });
}

/** Instances currently offered by a pending `choose`, sorted ([] if none pending). */
export function offeredInsts(g: TestGame): InstanceId[] {
  return kind(g) === 'choose' ? [...choices(g)].sort() : [];
}

/** True if the pending decision is a `choose` that may be ended with nothing. */
export function mayEnd(g: TestGame): boolean {
  return kind(g) === 'choose' && canFinish(g);
}

/** Brief description of the pending decision (for failure messages). */
export function whatNow(g: TestGame): string {
  const d = decision(g);
  return d ? `${d.player}:${d.kind}/${d.purpose} max=${d.max} ${d.prompt}` : 'none';
}

/** A deck: `top` first, then `n` plain filler cards. */
export function deckTop(top: CardId[], n = 12): CardId[] {
  return [...top, ...Array.from({ length: n }, () => SC9.mohji)];
}

/**
 * Finish a battle in which the defender neither blocks, counters, nor activates a [Trigger]:
 * answers Block, Counter and Trigger decisions with "no" until something else is pending (the next
 * Main Phase, or an effect prompt).
 */
export function noDefenceAtAll(g: TestGame): void {
  for (let i = 0; i < 12; i++) {
    const k = kind(g);
    if (k === 'block') act(g, { type: 'block', blocker: null });
    else if (k === 'counter') act(g, { type: 'endCounter' });
    else if (k === 'trigger' && !g.legal().some((a) => a.type === 'trigger' && a.activate)) {
      act(g, { type: 'trigger', activate: false });
    } else return;
  }
}

/**
 * An optional cost paid from the hidden hand is offered even when it cannot be paid, with "use"
 * illegal (so the opponent cannot tell an empty hand from a held card). Declines it.
 */
export function offeredUnpayable(g: TestGame, who: PlayerId = 'p1'): void {
  need(g, 'optional', who);
  expect(g.legal().some((a) => a.type === 'optional' && a.accept)).toBe(false);
  act(g, { type: 'optional', accept: false });
}

/**
 * A prompt must never depend on hidden cards: an "up to" pick over the hand or a looked-at deck
 * asks even when nothing qualifies (max 0, no candidate). Fails if it was skipped; ends it empty.
 */
export function askedEmpty(g: TestGame): void {
  need(g, 'choose');
  expect(choices(g)).toHaveLength(0);
  if (!canFinish(g)) throw new Error('empty choose without done');
  act(g, { type: 'done' });
}

/** p2 attacks p1's Leader with its Leader, p1 does not block or counter; stops at p1's trigger decision. */
export function hitMyLeader(g: TestGame): void {
  attack(g, g.leader('p2'), g.leader('p1'));
  if (kind(g) === 'block') act(g, { type: 'block', blocker: null });
  if (kind(g) === 'counter') act(g, { type: 'endCounter' });
}

// ---------------------------------------------------------------------------------------------
// [Trigger] games
// ---------------------------------------------------------------------------------------------

/**
 * p1 defends with `id` as the top Life card of `before` Life cards (the other Life cards are
 * filler) against a Leader hit; the opponent has `p2Life` Life cards. Stops at p1's `trigger`
 * decision. At resolution the Life card is in no area (CR 10-1-5-3), so p1 has `before - 1` Life.
 */
export function triggerGame(
  id: CardId,
  o: {
    leader?: string;
    before?: number;
    p2Life?: number;
    characters?: CardId[];
    hand?: CardId[];
    deck?: CardId[];
    trash?: CardId[];
    stage?: CardId;
    p2?: Partial<PlayerSpec>;
    costArea?: { active: number; rested: number };
  } = {},
): TestGame {
  const before = o.before ?? 3;
  const g = theirs(
    o.leader ?? LD9.rev,
    {
      life: [id, ...Array.from({ length: before - 1 }, () => SC9.mohji)],
      characters: o.characters ?? [],
      hand: o.hand ?? [],
      deck: o.deck ?? deckTop([]),
      trash: o.trash ?? [],
      ...(o.stage ? { stage: o.stage } : {}),
      ...(o.costArea ? { costArea: o.costArea } : {}),
    },
    { life: Array.from({ length: o.p2Life ?? 2 }, () => SC9.c1), ...(o.p2 ?? {}) },
  );
  hitLeader(g);
  need(g, 'trigger', 'p1');
  return g;
}

/** True if the Character area of `who` holds the card `id`. */
export function onField(g: TestGame, id: CardId, who: PlayerId = 'p1'): boolean {
  return g.zone(who, 'characters').some((c) => c.card === id);
}

export function describeRaTrigger(cfg: {
  id: CardId;
  cost: number;
  power: number;
  counter: number;
}): void {
  const { id } = cfg;
  describe(`${id} [Trigger] RA Leader and 5 or less Life in total: play this card`, () => {
    it(`printed values: cost ${cfg.cost}, ${cfg.power}, Counter +${cfg.counter}`, () => {
      const g = triggerGame(id);
      activateTrigger(g);
      const played = g.zone('p1', 'characters').find((x) => x.card === id)!;
      expect(played.cost).toBe(cfg.cost);
      expect(played.power).toBe(cfg.power);
      expect(played.counter).toBe(cfg.counter);
    });

    it("conditions met (Revolutionary Army Leader, 2 + 2 = 4 Life): played active; the opponent's Main Phase resumes", () => {
      const g = triggerGame(id, { before: 3, p2Life: 2 });
      activateTrigger(g);
      expect(atMain(g, 'p2')).toBe(true);
      const played = g.zone('p1', 'characters').find((x) => x.card === id);
      expect(played).toBeTruthy();
      expect(played!.rested).toBe(false);
      expect(g.life('p1')).toBe(2);
      expect(hand(g)).toEqual([]);
      expect(trash(g)).toEqual([]);
    });

    it('boundary: a total of exactly 5 Life cards (2 + 3) still plays it', () => {
      const g = triggerGame(id, { before: 3, p2Life: 3 });
      activateTrigger(g);
      expect(onField(g, id)).toBe(true);
    });

    it('boundary: a total of 6 (2 + 4) fails the condition: the activated card goes to the trash, nothing is played', () => {
      const g = triggerGame(id, { before: 3, p2Life: 4 });
      activateTrigger(g);
      expect(atMain(g, 'p2')).toBe(true);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g)).toEqual([id]);
      expect(hand(g)).toEqual([]);
    });

    it("counts both players' Life: my 1 + their 4 = 5 plays, my 1 + their 5 = 6 does not", () => {
      const ok = triggerGame(id, { before: 2, p2Life: 4 });
      activateTrigger(ok);
      expect(onField(ok, id)).toBe(true);
      const no = triggerGame(id, { before: 2, p2Life: 5 });
      activateTrigger(no);
      expect(no.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(no)).toEqual([id]);
    });

    it('the Life card being resolved is not counted: 3 left for me + 2 for them = 5 plays', () => {
      const g = triggerGame(id, { before: 4, p2Life: 2 });
      activateTrigger(g);
      expect(onField(g, id)).toBe(true);
    });

    it('a Leader without {Revolutionary Army} fails the condition: trashed, not played', () => {
      const g = triggerGame(id, { leader: LD9.luffy, before: 2, p2Life: 1 });
      activateTrigger(g);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(trash(g)).toEqual([id]);
    });

    it('declining the [Trigger]: the card goes to my hand, nothing is played', () => {
      const g = triggerGame(id, { before: 3, p2Life: 2 });
      act(g, { type: 'trigger', activate: false });
      expect(hand(g)).toEqual([id]);
      expect(g.zone('p1', 'characters')).toHaveLength(0);
      expect(g.life('p1')).toBe(2);
    });

    it('the play costs nothing: with no DON!! at all it is still played', () => {
      const g = triggerGame(id, { before: 3, p2Life: 2 });
      expect(don(g)).toMatchObject({ active: 0, rested: 0 });
      activateTrigger(g);
      expect(onField(g, id)).toBe(true);
      expect(don(g)).toMatchObject({ active: 0, rested: 0 });
    });
  });
}
