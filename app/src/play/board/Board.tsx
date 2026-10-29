/**
 * The board column (board.md §1, §3): both fields, the midline band and your hand, at the exact
 * rectangles from `layout.ts`. One tab stop per zone, in reading order (accessibility.md §3.1); the
 * zones are `role="group"` inside the `role="application"` board.
 */
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import type { Card } from '@optcg/cards';
import type { PlayerId, ProjectedView, ViewCard } from '@optcg/engine';
import { CardFace } from '../../art/index.ts';
import { cardAccessibleName, num, other, type Names } from '../game/text.ts';
import type { Legal } from '../game/legal.ts';
import { BoardCard, CardBack, GLYPHS, type Chip, type Glyph } from './BoardCard.tsx';
import type { Layout, Rect } from './layout.ts';

export type ZoneKey = 'opp-id' | 'opp-row' | 'opp-chars' | 'mid' | 'my-chars' | 'my-row' | 'hand';
export const ZONE_ORDER: ZoneKey[] = [
  'opp-id',
  'opp-row',
  'opp-chars',
  'mid',
  'my-chars',
  'my-row',
  'hand',
];

export interface CardDeco {
  glyph?: Glyph | null;
  legal?: boolean;
  selected?: boolean;
  dim?: boolean;
  acting?: string | null;
  battle?: boolean;
  raised?: boolean;
  chips?: Chip[];
  extraName?: string[];
  /** A staged value (defence planner) shown in place of the live power. */
  power?: number | null;
}

export interface BoardProps {
  view: ProjectedView;
  L: Layout;
  cards: ReadonlyMap<string, Card>;
  names: Names;
  legal: Legal;
  slots: Record<PlayerId, number[]>;
  deco: (handle: string) => CardDeco;
  roving: Record<string, number>;
  onRove: (zone: ZoneKey, i: number) => void;
  onCard: (handle: string, e: MouseEvent<HTMLElement>) => void;
  onCardKey: (handle: string, e: KeyboardEvent<HTMLElement>) => void;
  onPreview: (handle: string | null, how: 'hover' | 'focus') => void;
  onCostArea: () => void;
  onTrash: (p: PlayerId) => void;
  costLegal: boolean;
  donMode: boolean;
  /** The bottom hand is hidden (hotseat) and why. */
  handHidden: 'none' | 'hold' | 'click';
  onShowHand: () => void;
  /** Hotseat defence: a press and hold on the veil reveals the hand until released (M3-06). */
  onRevealStart: (pointerId: number) => void;
  mulligan: boolean;
  midline: ReactNode;
  oppActivity: string;
  oppThinking: boolean;
  arrow: { from: string; to: string; dashed: boolean; label?: string } | null;
  banner: string | null;
  label: string;
}

const PHASES = ['Refresh', 'Draw', 'DON!!', 'Main', 'End'];

export function Board(b: BoardProps) {
  const { view, L } = b;
  const me = view.player;
  const op = other(me);
  const roomy = L.density === 'roomy';
  const ownersTurn = (p: PlayerId) => view.turn.activePlayer === p;
  const pos = new Map<string, Rect>();

  const tab = (zone: ZoneKey, i: number) => ((b.roving[zone] ?? 0) === i ? 0 : -1);
  const item = (zone: ZoneKey, i: number) => ({
    tabIndex: tab(zone, i),
    'data-item': i,
    'data-zone': zone,
    onFocus: () => b.onRove(zone, i),
  });

  const whoseWord = (p: PlayerId, cap = true) =>
    b.names.hotseat ? `${b.names.player[p]}’s` : p === me ? (cap ? 'Your' : 'your') : 'Opponent’s';

  const card = (
    c: ViewCard,
    box: Rect,
    zone: 'leader' | 'characters' | 'stage' | 'hand',
    owner: PlayerId,
    zk: ZoneKey,
    i: number,
    size = L.card,
  ) => {
    const d = b.deco(c.handle);
    const def = c.card ? b.cards.get(c.card) : undefined;
    const extra = [...(d.extraName ?? [])];
    if (d.glyph) extra.push(GLYPHS[d.glyph][1]);
    const label = cardAccessibleName(c, {
      cards: b.cards,
      owner: whoseWord(owner),
      zone,
      ownersTurn: ownersTurn(owner),
      extra,
    });
    const bw = c.rested && zone !== 'hand' ? size.h : size.w;
    const bh = c.rested && zone !== 'hand' ? size.w : size.h;
    pos.set(c.handle, { x: box.x + (box.w - bw) / 2, y: box.y + (box.h - bh) / 2, w: bw, h: bh });
    return (
      <BoardCard
        key={c.handle}
        view={d.power !== undefined ? { ...c, power: d.power } : c}
        def={def}
        box={box}
        size={size}
        roomy={roomy}
        label={label}
        zone={zone}
        donLive={ownersTurn(owner)}
        glyph={d.glyph ?? null}
        legal={d.legal ?? false}
        selected={d.selected ?? false}
        dim={d.dim ?? false}
        acting={d.acting ?? null}
        battle={d.battle ?? false}
        raised={d.raised ?? false}
        chips={d.chips ?? []}
        tabIndex={tab(zk, i)}
        dataZone={zk}
        dataItem={i}
        onClick={(e) => b.onCard(c.handle, e)}
        onKeyDown={(e) => b.onCardKey(c.handle, e)}
        onFocus={() => {
          b.onRove(zk, i);
          b.onPreview(c.handle, 'focus');
        }}
        onPointerEnter={() => b.onPreview(c.handle, 'hover')}
        onPointerLeave={() => b.onPreview(null, 'hover')}
      ></BoardCard>
    );
  };

  // ---------------- Leader rows ----------------
  const leaderRow = (p: PlayerId, R: Layout['me'], zk: ZoneKey) => {
    const z = view.zones[p];
    const d = view.don[p];
    const mine = p === me;
    const W = whoseWord(p);
    const leader = z.leader[0];
    const stage = z.stage[0];
    const trashTop = z.trash[0];
    const lifeN = z.life.length;
    const setupPhase = view.turn.phase === 'setup';
    let i = 0;
    const tw = L.token.w;
    const th = L.token.h;
    const labW = L.costLabelW;
    const inner = R.cost.w - labW - 6;
    const pitch = (n: number, w: number, gap: number) =>
      n <= 1 ? 0 : Math.min(w + gap, (inner - w) / (n - 1));
    const aTop = roomy ? 8 : 5;
    const rTop = aTop + th + (roomy ? 10 : 7);
    const gTop = rTop + tw + (roomy ? 10 : 7);
    const lifeBackH = Math.round(L.card.w * 0.92);
    const lifeStep =
      lifeN > 1 ? Math.min(L.card.w * 0.1, (R.life.h - 8 - lifeBackH) / (lifeN - 1)) : 0;
    const items: ReactNode[] = [];
    items.push(
      <button
        key="dd"
        type="button"
        className="z dondeck"
        style={rect(R.donDeck)}
        {...item(zk, i++)}
      >
        <span className="sr-only">{`${W} DON!! deck, ${d.deck}`}</span>
        <span className="vis" aria-hidden="true">
          <span
            className="tok faded"
            style={{ ...tok(tw, th), left: (R.donDeck.w - tw) / 2 - 3, top: 6 }}
          />
          <span className="tok" style={{ ...tok(tw, th), left: (R.donDeck.w - tw) / 2, top: 10 }} />
          <span className="dplate" aria-hidden="true">
            <span>DON!! deck</span>
            <b>{d.deck}</b>
          </span>
        </span>
      </button>,
    );
    items.push(
      <div key="ca" className="z costarea" style={rect(R.cost)}>
        <button
          type="button"
          className={`rowbtn ${mine && b.costLegal ? 'legal' : ''} ${mine && b.donMode ? 'selected' : ''}`}
          style={{ top: aTop - 3, height: th + 6 }}
          aria-pressed={mine ? b.donMode : undefined}
          onClick={mine ? b.onCostArea : undefined}
          {...item(zk, i++)}
        >
          <span className="sr-only">{`${d.active} active DON!!${mine && b.costLegal ? ', select to give DON!!' : ''}`}</span>
          <span className="vis" aria-hidden="true">
            {mine && b.costLegal && (
              <span className="glyph g-don" aria-hidden="true">
                ◆
              </span>
            )}
          </span>
        </button>
        <span className="dl act" style={{ top: aTop, width: labW, height: th }} aria-hidden="true">
          <b className="dn">{d.active}</b>
          <span>active</span>
        </span>
        {Array.from({ length: d.active }, (_, k) => (
          <span
            key={`a${k}`}
            className="tok"
            style={{ ...tok(tw, th), left: labW + k * pitch(d.active, tw, 1), top: aTop }}
            aria-hidden="true"
          >
            ◆
          </span>
        ))}
        <span
          className="dl rest"
          style={{ top: rTop - (roomy ? 4 : 3), width: labW, height: tw + (roomy ? 8 : 6) }}
          aria-hidden="true"
        >
          <b>⟳ {d.rested}</b>
          <span>rested</span>
        </span>
        {Array.from({ length: d.rested }, (_, k) => (
          <span
            key={`r${k}`}
            className="tok r"
            style={{ ...tok(th, tw), left: labW + k * pitch(d.rested, th, 2), top: rTop }}
            aria-hidden="true"
          >
            ◆
          </span>
        ))}
        <button type="button" className="dl given" style={{ top: gTop }} {...item(zk, i++)}>
          <span className="sr-only">{`${d.rested} rested DON!!, ${d.given} given to cards`}</span>
          <span className="vis" aria-hidden="true">
            {d.given ? `+${d.given} given to cards` : 'none given'}
          </span>
        </button>
        {mine && b.donMode && <span className="cchip don below-zone">◆ Giving DON!!</span>}
      </div>,
    );
    items.push(
      setupPhase && lifeN === 0 ? (
        <button
          key="life"
          type="button"
          className="z slot empty"
          style={rect(R.life)}
          {...item(zk, i++)}
        >
          <span className="sr-only">{`${W} Life, placed after the mulligan`}</span>
          <span className="vis" aria-hidden="true">
            <span className="zlabel">Life · placed after the mulligan</span>
          </span>
        </button>
      ) : lifeN === 0 ? (
        <button
          key="life"
          type="button"
          className="z slot empty warn"
          style={rect(R.life)}
          {...item(zk, i++)}
        >
          <span className="sr-only">{`${W} Life, 0, next hit loses`}</span>
          <span className="vis" aria-hidden="true">
            <span className="plate warn static">
              ⚠ 0 <small>Life · next hit loses</small>
            </span>
          </span>
        </button>
      ) : (
        <button key="life" type="button" className="z life" style={rect(R.life)} {...item(zk, i++)}>
          <span className="sr-only">{`${W} Life, ${n(lifeN, 'card')}, face down`}</span>
          <span className="vis" aria-hidden="true">
            {Array.from({ length: lifeN }, (_, k) => {
              const top = mine ? 4 + k * lifeStep : R.life.h - 4 - lifeBackH - k * lifeStep;
              return (
                <CardBack
                  key={k}
                  className="land"
                  style={{ left: 4, top, width: R.life.w - 8, height: lifeBackH, zIndex: 10 - k }}
                />
              );
            })}
            <span className="plate life-count top" aria-hidden="true">
              {lifeN} <small>Life</small>
            </span>
          </span>
        </button>
      ),
    );
    if (leader) items.push(card(leader, R.leader, 'leader', p, zk, i++));
    items.push(
      stage ? (
        card(stage, R.stage, 'stage', p, zk, i++)
      ) : (
        <button
          key="stage"
          type="button"
          className="z slot empty"
          style={rect(R.stage)}
          {...item(zk, i++)}
        >
          <span className="sr-only">{`${W} Stage, empty`}</span>
          <span className="vis" aria-hidden="true">
            <span className="zlabel">Stage</span>
          </span>
        </button>
      ),
    );
    const deckN = z.deck.length;
    items.push(
      <button key="deck" type="button" className="z deck" style={rect(R.deck)} {...item(zk, i++)}>
        <span className="sr-only">{`${W} deck, ${n(deckN, 'card')}${deckN <= 5 ? ', running low' : ''}`}</span>
        <span className="vis" aria-hidden="true">
          <CardBack style={{ inset: 0 }} />
          <span className={`plate count ${deckN <= 5 ? 'warn' : ''}`} aria-hidden="true">
            {deckN} <small>{deckN <= 5 ? '⚠ Deck' : 'Deck'}</small>
          </span>
        </span>
      </button>,
    );
    const trashDef = trashTop?.card ? b.cards.get(trashTop.card) : undefined;
    items.push(
      <button
        key="trash"
        type="button"
        className="z trash"
        style={rect(R.trash)}
        aria-haspopup="dialog"
        onClick={() => b.onTrash(p)}
        {...item(zk, i)}
      >
        <span className="sr-only">{`${W} trash, ${n(z.trash.length, 'card')}${trashDef ? `, top: ${trashDef.name}` : ''}. Open the trash viewer`}</span>
        <span className="vis" aria-hidden="true">
          {trashDef ? (
            <span
              className="trash-face"
              style={{
                ['--card-w' as string]: `${L.card.w}px`,
                ['--card-h' as string]: `${L.card.h}px`,
              }}
            >
              <TrashFace def={trashDef} stacked={L.stacked} />
            </span>
          ) : (
            <span className="slot empty inner" />
          )}
          <span className="plate count tl" aria-hidden="true">
            {z.trash.length} <small>Trash</small>
          </span>
        </span>
      </button>,
    );
    return (
      <div className="zone" role="group" aria-label={`${W} Leader row`} data-zone={zk}>
        {items}
      </div>
    );
  };

  // ---------------- Character rows ----------------
  const charRow = (p: PlayerId, R: Layout['me'], zk: ZoneKey) => {
    const z = view.zones[p].characters;
    const slots = b.slots[p];
    const W = whoseWord(p);
    const showMulligan = b.mulligan && p === me;
    return (
      <div
        className="zone"
        role="group"
        aria-label={`${W} Characters, ${z.length} of 5`}
        data-zone={zk}
      >
        {R.chars.map((r, k) => (
          <span key={`s${k}`} className="slot outline" style={rect(r)} aria-hidden="true">
            {z.length === 0 && k === 2 && !showMulligan && (
              <span className="zlabel">Character area</span>
            )}
          </span>
        ))}
        {z.length === 0 && !showMulligan ? (
          <button
            type="button"
            className="z empty-zone"
            style={rect(R.chars[2]!)}
            aria-label={`${W} Characters, empty`}
            {...item(zk, 0)}
          />
        ) : (
          z.map((c, i) => card(c, R.chars[slots[i] ?? i] ?? R.chars[i]!, 'characters', p, zk, i))
        )}
      </div>
    );
  };

  // ---------------- Hands ----------------
  const oppHand = view.zones[op].hand;
  const handZ = view.zones[me].hand;
  const H = L.hand;
  const cw = L.card.w;
  const maxNo = Math.floor((H.w + 8) / (cw + 8));
  const handPitch = handZ.length <= maxNo ? cw + 8 : (H.w - cw) / Math.max(1, handZ.length - 1);
  const handW = handZ.length ? cw + (handZ.length - 1) * handPitch : 0;
  const handX0 = Math.max(H.x, Math.min(L.axis - handW / 2, H.x + H.w - handW));

  const mulliganCards = b.mulligan
    ? handZ.map((c, i) => {
        const s = L.mulligan.card;
        const gap = 10;
        const total = handZ.length * s.w + (handZ.length - 1) * gap;
        const box = { x: L.axis - total / 2 + i * (s.w + gap), y: L.mulligan.y, w: s.w, h: s.h };
        return card(c, box, 'hand', me, 'my-chars', i, s);
      })
    : null;

  const oppBack = Math.min(L.card.w * 0.55, 46);
  const showN = Math.min(oppHand.length, 10);

  return (
    <div
      className={`board ${roomy ? 'roomy' : 'compact'}`}
      role="application"
      aria-roledescription="game board"
      aria-label={b.label}
      style={{ width: L.boardW, height: L.H }}
    >
      {!view.result && (
        <div
          className={`turnbar ${view.turn.activePlayer === me ? 'me' : 'opp'}`}
          style={turnbar(L, view.turn.activePlayer === me)}
          aria-hidden="true"
        />
      )}
      {/* 1. Opponent identity and hand */}
      <div className="zone" role="group" aria-label="Opponent" data-zone="opp-id">
        <button type="button" className="oppid" style={rect(L.oppId)} {...item('opp-id', 0)}>
          <span className="sr-only">{`${b.names.hotseat ? b.names.player[op] : `Opponent: ${b.names.player[op]}`}${b.oppThinking ? ', thinking' : ''}`}</span>
          <span className="vis" aria-hidden="true">
            <span className="chip opp-tag">{b.names.hotseat ? b.names.player[op] : 'Opp'}</span>
            <span className="oppname">
              {b.names.hotseat
                ? leaderName(view, op, b.cards)
                : `${b.names.player[op]} · Rookie AI`}
            </span>
            {b.oppThinking && <span className="chip outline">Thinking</span>}
          </span>
        </button>
        <button type="button" className="opphand" style={rect(L.oppHand)} {...item('opp-id', 1)}>
          <span className="sr-only">{`${whoseWord(op)} hand, ${n(oppHand.length, 'card')}`}</span>
          <span className="vis" aria-hidden="true">
            <span className="backs" aria-hidden="true">
              {Array.from({ length: showN }, (_, k) => (
                <CardBack
                  key={k}
                  className="peek"
                  style={{
                    width: oppBack,
                    height: Math.round((oppBack * 88) / 63),
                    left: k * (oppBack + 4),
                  }}
                />
              ))}
            </span>
            <span className="count-label" aria-hidden="true">
              {oppHand.length} {oppHand.length === 1 ? 'card' : 'cards'}
            </span>
          </span>
        </button>
      </div>
      {/* 2–3. Opponent */}
      {leaderRow(op, L.opp, 'opp-row')}
      {charRow(op, L.opp, 'opp-chars')}
      {/* 4. Midline */}
      <div
        className="zone midline"
        role="group"
        aria-label="Turn and phase"
        data-zone="mid"
        style={rect(L.mid)}
      >
        <button type="button" className="mid-left" {...item('mid', 1)}>
          <span className="sr-only">{b.oppActivity || 'No opponent activity'}</span>
          <span className="vis" aria-hidden="true">
            {b.oppThinking && <span className="think-dot" aria-hidden="true" />}
            {b.oppActivity}
          </span>
        </button>
        <div className="mid-centre" style={{ left: L.midCentre.x - L.mid.x, width: L.midCentre.w }}>
          {b.midline}
        </div>
        <span className="mid-right" />
      </div>
      {/* 5–6. You */}
      {b.mulligan ? (
        <div className="zone" role="group" aria-label="Your opening hand" data-zone="my-chars">
          {L.me.chars.map((r, k) => (
            <span key={`s${k}`} className="slot outline" style={rect(r)} aria-hidden="true" />
          ))}
          {mulliganCards}
        </div>
      ) : (
        charRow(me, L.me, 'my-chars')
      )}
      {leaderRow(me, L.me, 'my-row')}
      {/* 7. Your hand */}
      <div
        className={`zone hand ${L.peek ? 'peek' : ''}`}
        role="group"
        aria-label={`${whoseWord(me)} hand, ${n(handZ.length, 'card')}`}
        data-zone="hand"
      >
        {b.handHidden !== 'none' ? (
          <button
            type="button"
            className="hand-veil"
            style={rect(H)}
            onClick={b.handHidden === 'click' ? b.onShowHand : undefined}
            onPointerDown={
              b.handHidden === 'hold'
                ? (e) => {
                    e.preventDefault();
                    b.onRevealStart(e.pointerId);
                  }
                : undefined
            }
            onContextMenu={(e) => e.preventDefault()}
            {...item('hand', 0)}
          >
            {b.handHidden === 'hold'
              ? `${b.names.player[me]}’s hand is hidden. ${b.names.player[me]}: press and hold here, or hold R, to see it.`
              : `${b.names.player[me]}’s hand is hidden. ${b.names.player[me]}: press Space or click to show it.`}
          </button>
        ) : b.mulligan ? (
          <button type="button" className="hand-veil plain" style={rect(H)} {...item('hand', 0)}>
            Your opening hand is shown above.
          </button>
        ) : handZ.length === 0 ? (
          <button type="button" className="z empty-zone" style={rect(H)} {...item('hand', 0)}>
            <span className="sr-only">{'Your hand, empty'}</span>
            <span className="vis" aria-hidden="true">
              <span className="zlabel">Hand · empty</span>
            </span>
          </button>
        ) : (
          handZ.map((c, i) =>
            card(
              c,
              { x: handX0 + i * handPitch, y: H.y, w: cw, h: L.card.h },
              'hand',
              me,
              'hand',
              i,
            ),
          )
        )}
      </div>
      {b.arrow && <Arrow arrow={b.arrow} pos={pos} />}
      {b.banner && (
        <div
          className="banner"
          style={{ left: L.mid.x, top: L.mid.y, width: L.mid.w, height: L.mid.h }}
          role="presentation"
        >
          {b.banner}
        </div>
      )}
    </div>
  );
}

function TrashFace({ def, stacked }: { def: Card; stacked: boolean }) {
  return (
    <span className={`trash-inner ${stacked ? 'stacked' : ''}`}>
      <CardFaceLazy def={def} />
    </span>
  );
}

function CardFaceLazy({ def }: { def: Card }) {
  return <CardFace card={def} plates={false} />;
}

function leaderName(view: ProjectedView, p: PlayerId, cards: ReadonlyMap<string, Card>): string {
  const id = view.zones[p].leader[0]?.card;
  return id ? (cards.get(id)?.name ?? '') : '';
}

const n = (k: number, word: string) => `${k} ${word}${k === 1 ? '' : 's'}`;
const rect = (r: Rect) => ({ left: r.x, top: r.y, width: r.w, height: r.h });
const tok = (w: number, h: number) => ({ width: w, height: h });
const turnbar = (L: Layout, mine: boolean) => {
  const top = mine ? L.mid.y + L.mid.h / 2 : 0;
  const bottom = mine ? L.H : L.mid.y + L.mid.h / 2;
  return { top, height: bottom - top };
};

export function PhaseStepper({ view, battle }: { view: ProjectedView; battle: boolean }) {
  const phase = view.turn.phase;
  if (battle) {
    const steps = ['Attack', 'Block', 'Counter', 'Damage'];
    const cur = view.turn.battleStep;
    const idx = cur === 'attack' ? 0 : cur === 'block' ? 1 : cur === 'counter' ? 2 : 3;
    return (
      <ol className="stepper" aria-label="Battle steps">
        <li className="past">Main</li>
        <li className="sep" aria-hidden="true">
          ›
        </li>
        <li className="lbl">Battle:</li>
        {steps.map((s, i) => (
          <Step
            key={s}
            label={s}
            state={i < idx ? 'past' : i === idx ? 'cur' : 'future'}
            sep={i > 0}
          />
        ))}
      </ol>
    );
  }
  const idx =
    phase === 'refresh'
      ? 0
      : phase === 'draw'
        ? 1
        : phase === 'don'
          ? 2
          : phase === 'main'
            ? 3
            : phase === 'end'
              ? 4
              : -1;
  return (
    <ol className="stepper" aria-label="Phases">
      {PHASES.map((s, i) => (
        <Step
          key={s}
          label={s}
          state={i < idx ? 'past' : i === idx ? 'cur' : 'future'}
          sep={i > 0}
        />
      ))}
    </ol>
  );
}

function Step({ label, state, sep }: { label: string; state: string; sep: boolean }) {
  return (
    <>
      {sep && (
        <li className="sep" aria-hidden="true">
          ›
        </li>
      )}
      <li className={state} aria-current={state === 'cur' ? 'step' : undefined}>
        {state === 'cur' && <span aria-hidden="true">▸ </span>}
        {label}
      </li>
    </>
  );
}

/** The attack arrow (board.md §3.10): attacker centre to a ⌖ in the lower half of the target. */
function Arrow({
  arrow,
  pos,
}: {
  arrow: NonNullable<BoardProps['arrow']>;
  pos: Map<string, Rect>;
}) {
  const a = pos.get(arrow.from);
  const t = pos.get(arrow.to);
  if (!a || !t) return null;
  const x1 = a.x + a.w / 2;
  const y1 = a.y + a.h / 2;
  const x2 = t.x + t.w / 2;
  // The ⌖ sits in the lower half of the art window, clear of the plates and the name (UX-R13).
  const y2 = t.y + t.h * 0.45;
  // The line runs under the cards, so it never crosses a plate or chip; only the last stretch,
  // from the target's edge to its ⌖, draws on top.
  const ey = y1 < y2 ? t.y - 2 : t.y + t.h + 2;
  const k = (ey - y1) / (y2 - y1 || 1);
  const ex = x1 + (x2 - x1) * k;
  const len = Math.hypot(x2 - ex, y2 - ey) || 1;
  const hx = x2 - ((x2 - ex) / len) * 13;
  const hy = y2 - ((y2 - ey) / len) * 13;
  const stroke = { stroke: 'var(--color-attack)', strokeWidth: 4 };
  return (
    <>
      <svg className="arrow" aria-hidden="true" width="100%" height="100%">
        <line
          x1={x1}
          y1={y1}
          x2={ex}
          y2={ey}
          {...stroke}
          strokeDasharray={arrow.dashed ? '10 8' : undefined}
        />
        {arrow.label && (
          <text x={(x1 + ex) / 2 + 8} y={(y1 + ey) / 2} className="arrow-label">
            {arrow.label}
          </text>
        )}
      </svg>
      <svg className="arrow top" aria-hidden="true" width="100%" height="100%">
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-attack)" />
          </marker>
        </defs>
        <line x1={ex} y1={ey} x2={hx} y2={hy} {...stroke} markerEnd="url(#arrowhead)" />
        <circle cx={x2} cy={y2} r={11} fill="none" stroke="var(--color-attack)" strokeWidth={2.5} />
        <path
          d={`M${x2 - 15},${y2} h8 M${x2 + 7},${y2} h8 M${x2},${y2 - 15} v8 M${x2},${y2 + 7} v8`}
          stroke="var(--color-attack)"
          strokeWidth={2}
        />
      </svg>
    </>
  );
}

export { num };
