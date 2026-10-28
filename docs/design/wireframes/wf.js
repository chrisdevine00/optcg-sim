/*
 * OPTCG Sim wireframes: board renderer and page helpers.
 * Geometry: board.md §3.1 (1280×720, compact) and §3.2 (1920×1080, roomy). Values are copied, not derived.
 * No card art is ever loaded. Art is a labelled placeholder inside the art-window frame (card-face-study.md, treatment C).
 */
(function () {
  'use strict';

  const G = {
    compact: {
      W: 1280, H: 720, card: [84, 117], slot: 117, tok: [24, 34], axis: 480, handGap: 8, handMax: 10,
      oppId: [16, 0, 238, 32], oppHand: [270, 0, 420, 32],
      oppDonDeck: [20, 49, 60, 100], oppCost: [88, 40, 185, 117], oppLife: [289, 40, 117, 117],
      oppLeader: [422, 40, 117, 117], oppStage: [555, 40, 117, 117], oppDeck: [768, 40, 84, 117], oppTrash: [860, 40, 84, 117],
      charX: [172, 297, 422, 547, 672], oppCharY: 165, myCharY: 338,
      mid: [16, 290, 928, 40], midCentre: [220, 740],
      myDonDeck: [20, 472, 60, 100], myCost: [88, 463, 185, 117], myLife: [289, 463, 117, 117],
      myLeader: [422, 463, 117, 117], myStage: [555, 463, 117, 117], myDeck: [768, 463, 84, 117], myTrash: [860, 463, 84, 117],
      myHand: [16, 592, 928, 117],
      mat: [0, 0, 960, 720],
      rail: [960, 0, 320, 720], railHead: 44,
      log: { collapsed: [44, 380], open: [44, 148], tall: [44, 76] },
      coachZ: { collapsed: [424, 48], open: [192, 280], tall: [120, 352] },
      decision: [472, 248], dParts: [36, 148, 64],
      dock: [872, 8, 400, 456],
    },
    roomy: {
      W: 1920, H: 1080, card: [126, 176], slot: 176, tok: [36, 51], axis: 760, handGap: 8, handMax: 11,
      oppId: [24, 0, 397, 48], oppHand: [445, 0, 630, 48],
      oppDonDeck: [68, 77, 91, 143], oppCost: [171, 60, 277, 176], oppLife: [472, 60, 176, 176],
      oppLeader: [672, 60, 176, 176], oppStage: [872, 60, 176, 176], oppDeck: [1232, 60, 126, 176], oppTrash: [1370, 60, 126, 176],
      charX: [296, 484, 672, 860, 1048], oppCharY: 248, myCharY: 504,
      mid: [24, 436, 1472, 56], midCentre: [500, 1020],
      myDonDeck: [68, 709, 91, 143], myCost: [171, 692, 277, 176], myLife: [472, 692, 176, 176],
      myLeader: [672, 692, 176, 176], myStage: [872, 692, 176, 176], myDeck: [1232, 692, 126, 176], myTrash: [1370, 692, 126, 176],
      myHand: [24, 884, 1472, 176],
      mat: [0, 0, 1520, 1080],
      rail: [1520, 0, 400, 1080], railHead: 56,
      log: { collapsed: [56, 640], open: [56, 288], tall: [56, 88] },
      coachZ: { collapsed: [696, 48], open: [344, 400], tall: [144, 600] },
      decision: [744, 336], dParts: [44, 220, 72],
      dock: [1432, 8, 480, 728],
    },
  };

  const KW = {
    blocker: ['⛨', 'Blocker'], rush: ['»', 'Rush'], rushc: ['»C', 'Rush: Character'], double: ['×2', 'Double Attack'],
    banish: ['⊘', 'Banish'], unblockable: ['⤳', 'Unblockable'], trigger: ['T', 'Trigger'],
  };
  const GLYPH = { play: ['▶', 'can be played'], attack: ['⚔', 'can attack'], don: ['◆', 'can receive DON!!'], target: ['⌖', 'can be targeted'], ability: ['⚡', 'ability ready'], pick: ['✓', 'chosen'] };
  const COLOURS = { blue: 'Blue', purple: 'Purple', red: 'Red', green: 'Green', yellow: 'Yellow', black: 'Black' };

  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const px = (r) => `left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px`;

  function isRoomy() { return window.matchMedia('(min-width: 1600px) and (min-height: 900px)').matches; }

  /* ---------- Card ---------- */
  function cardHTML(c, rect, g, o = {}) {
    // rect = slot or position box [x, y, w, h]; the card's bounding box is centred inside it.
    const [cw, ch] = g.card;
    const bw = c.r ? ch : cw, bh = c.r ? cw : ch;
    const x = rect[0] + (rect[2] - bw) / 2, y = rect[1] + (rect[3] - bh) / 2;
    const st = c.st || [];
    const cls = ['card', `c-${c.col || 'blue'}`, c.r ? 'rested' : '', ...st].filter(Boolean).join(' ');
    const base = c.base ?? c.p;
    let pow = '';
    if (c.timing) pow = `<span class="b timing">${esc(c.timing)}</span>`;
    else if (c.p !== undefined && c.p !== null) {
      const dir = c.p > base ? 'buff' : c.p < base ? 'debuff' : '';
      const ar = dir === 'buff' ? '<span class="ar" aria-hidden="true">▲</span>' : dir === 'debuff' ? '<span class="ar" aria-hidden="true">▼</span>' : '';
      pow = `<span class="b pow ${dir}">${String(c.p).replace('-', '−')}${ar}</span>`;
    }
    const costDir = c.costBase !== undefined ? (c.cost > c.costBase ? 'buff' : c.cost < c.costBase ? 'debuff' : '') : '';
    const cost = c.cost !== undefined && c.cost !== null ? `<span class="b cost ${costDir}">${c.cost}</span>` : '';
    // DON!! and keyword badges sit at the art window's bottom edge; on rested cards they move to the art-side corner.
    const bh2 = `var(--badge-h)`;
    const winBottom = c.r ? `bottom:var(--badge-inset)` : `top:calc(${ch * 0.58}px - ${bh2} - var(--badge-inset))`;
    const don = c.don ? `<span class="b don ${c.donOff ? 'off' : ''}" style="${winBottom};${c.r ? `left:auto;right:calc(var(--badge-inset) + ${(c.kw && c.kw.length) ? 'var(--badge-h) + 4px' : '0px'})` : ''}"><span class="d" aria-hidden="true">◆</span>${c.don}</span>` : '';
    let kw = '';
    if (c.kw && c.kw.length) {
      const shown = c.kw.slice(0, 2).map((k) => KW[k][0]).join(' ');
      const more = c.kw.length > 2 ? ` +${c.kw.length - 2}` : '';
      kw = `<span class="b kw" style="${winBottom}" title="${esc(c.kw.map((k) => KW[k][1]).join(', '))}">${shown}${more}</span>`;
    }
    const ctr = c.ctr ? `<span class="b ctr">${esc(c.ctr)}</span>` : '';
    const glyph = c.g ? `<span class="glyph" aria-hidden="true">${GLYPH[c.g][0]}</span>` : '';
    const chips = (c.chips || []).map((ch2) => `<span class="cchip ${ch2.cls || ''} ${ch2.pos || (c.r ? 'below' : 'top')}">${ch2.t}</span>`).join('');
    const restedChip = c.r && !c.noRestChip ? `<span class="cchip below" aria-hidden="true">⟳ Rested</span>` : '';
    const peek = c.don ? `<span class="don-peek" aria-hidden="true">${'<i></i>'.repeat(Math.min(3, c.don))}</span>` : '';
    const label = c.aria || autoName(c);
    const tag = o.tag || 'button';
    return `<${tag} class="${cls}" ${c.id ? `id="${c.id}"` : ''} style="left:${x}px;top:${y}px;width:${bw}px;height:${bh}px" aria-label="${esc(label)}" ${tag === 'button' ? 'type="button"' : 'role="img"'} data-name="${esc(c.n)}">
      ${peek}<span class="face" aria-hidden="true"><span class="art"><span class="al">art</span></span><span class="foot"><span class="nm">${esc(c.n).replace(/\.(?=\S)/g, '.\u200b')}</span><span class="band"><span class="ini">${esc((c.colInit) || (COLOURS[c.col || 'blue'] || '')[0])}</span></span></span></span>
      ${cost}${pow}${don}${kw}${ctr}${glyph}${restedChip}${chips}</${tag}>`;
  }
  function autoName(c) {
    const bits = [c.who ? `${c.who} ${c.n}` : c.n];
    if (c.kind) bits.push(c.kind);
    if (!c.inHand) bits.push(c.r ? 'rested' : 'active');
    if (c.timing) bits.push(c.timing.replace(/[[\]]/g, '') + ' Event');
    if (c.p !== undefined && c.p !== null && !c.timing) bits.push(`${c.p} power`);
    if (c.cost !== undefined && c.inHand) bits.push(`cost ${c.cost}`);
    if (c.ctr) bits.push(`Counter ${c.ctr}`);
    if (c.don) bits.push(`${c.don} DON!! given${c.donOff ? ', no power on opponent’s turn' : ''}`);
    if (c.kw) bits.push(c.kw.map((k) => KW[k][1]).join(', '));
    if (c.g) bits.push(GLYPH[c.g][1]);
    if (c.col) bits.push(COLOURS[c.col]);
    return bits.join(', ');
  }

  /* ---------- Zones ---------- */
  function backs(n, rect, g, mine) {
    // Life: landscape backs in a square box, top of pile nearest the midline (board.md §3.3)
    const [cw] = g.card; const lw = rect[2] - 8, lh = Math.round(cw * 0.92);
    const d = n > 1 ? Math.min(cw * 0.1, (rect[3] - 8 - lh) / (n - 1)) : 0;
    let h = '';
    for (let i = 0; i < n; i++) {
      // i = 0 is the top of the pile
      const yy = mine ? rect[1] + 4 + i * d : rect[1] + rect[3] - 4 - lh - i * d;
      h = `<span class="back" style="left:${rect[0] + 4}px;top:${yy}px;width:${lw}px;height:${lh}px;z-index:${10 - i}" aria-hidden="true"></span>` + h;
    }
    return h;
  }

  function costArea(side, rect, g, p) {
    const [tw, th] = g.tok;
    const roomy = g === G.roomy;
    const lab = roomy ? 18 : 16;
    const inner = rect[2] - 8;
    const rowTok = (n, w, gap) => (n <= 1 ? 0 : Math.min(w + gap, (inner - w) / (n - 1)));
    let h = `<div class="z costarea" role="group" aria-label="${side === 'me' ? 'Your' : 'Opponent’s'} cost area: ${p.active} active, ${p.rested} rested" style="${px(rect)}">`;
    const aTop = 2, aTokTop = aTop + lab + 2;
    const rTop = aTokTop + th + (roomy ? 8 : 4), rTokTop = rTop + lab + 2;
    h += `<button type="button" class="rowbtn ${p.donLegal ? 'legal' : ''}" style="top:${aTop}px;height:${lab + th + 4}px" aria-label="${p.active} active DON!!${p.donLegal ? ', select to give DON!!' : ''}"></button>`;
    h += `<span class="rl" style="top:${aTop}px">Active <b>${p.active}</b></span>`;
    const pa = rowTok(p.active, tw, 1);
    for (let i = 0; i < p.active; i++) h += `<span class="tok" style="--tok-w:${tw}px;--tok-h:${th}px;left:${4 + i * pa}px;top:${aTokTop}px" aria-hidden="true">◆</span>`;
    h += `<span class="rl" style="top:${rTop}px">⟳ Rested <b>${p.rested}</b></span>`;
    const pr = rowTok(p.rested, th, 2);
    for (let i = 0; i < p.rested; i++) h += `<span class="tok r" style="--tok-w:${tw}px;--tok-h:${th}px;left:${4 + i * pr}px;top:${rTokTop}px" aria-hidden="true">◆</span>`;
    if (p.donMode) h += `<span class="cchip don below" style="top:calc(100% + 2px)">◆ Giving DON!!</span>`;
    return h + '</div>';
  }

  function deckZone(label, n, rect, g, warn) {
    return `<div class="z" role="group" aria-label="${label}, ${n} cards" style="${px(rect)}"><span class="back" style="left:0;top:0;width:100%;height:100%"></span>
      <span class="plate ${warn ? 'warn' : ''}" style="right:4px;bottom:4px">${n} <small>${warn ? '⚠ ' : ''}Deck</small></span></div>`;
  }
  function donDeck(label, n, rect, g) {
    const [tw, th] = g.tok;
    return `<div class="z" role="group" aria-label="${label}, ${n} DON!!" style="${px(rect)}">
      <span class="tok" style="--tok-w:${tw}px;--tok-h:${th}px;left:${(rect[2] - tw) / 2 - 3}px;top:6px;opacity:.55" aria-hidden="true"></span>
      <span class="tok" style="--tok-w:${tw}px;--tok-h:${th}px;left:${(rect[2] - tw) / 2}px;top:10px" aria-hidden="true">◆</span>
      <span class="plate" style="left:50%;transform:translateX(-50%);bottom:4px">${n} <small>DON!!</small></span></div>`;
  }
  function trashZone(label, t, rect, g, pre) {
    let h = `<div class="z" role="group" aria-label="${label}, ${t.n} cards${t.top ? ', top: ' + t.top.n : ''}" style="${px(rect)}">`;
    if (t.top) h += cardHTML({ ...t.top, cost: undefined, p: undefined, timing: undefined, kw: undefined, aria: `${label}, ${t.n} cards, top: ${t.top.n}. Open trash viewer` }, [0, 0, rect[2], rect[3]], g);
    else h += `<span class="slot empty" style="left:0;top:0;width:100%;height:100%"><span class="zlabel">Trash</span></span>`;
    h += `<span class="plate" style="left:2px;top:2px;z-index:6">${t.n} <small>Trash</small></span></div>`;
    return h;
  }
  function lifeZone(label, n, rect, g, mine) {
    if (n === null) return `<div class="z slot empty" role="group" aria-label="${label}, not placed yet" style="${px(rect)}"><span class="zlabel">Life · placed after the mulligan</span></div>`;
    if (n === 0) return `<div class="z slot empty" role="group" aria-label="${label}, 0 Life, next hit loses" style="${px(rect)};border-color:var(--color-warning)"><span class="plate warn" style="position:static">⚠ 0 <small>Life · next hit loses</small></span></div>`;
    return `<div class="z" role="group" aria-label="${label}, ${n} cards, face down" style="${px(rect)}">${backs(n, [0, 0, rect[2], rect[3]], g, mine)}
      <span class="plate" style="right:2px;bottom:${mine ? 2 : 'auto'}px;${mine ? '' : 'top:2px;'}z-index:12">${n} <small>Life</small></span></div>`;
  }
  function slotHTML(c, rect, g, label, emptyLabel) {
    if (!c) return `<div class="slot empty" style="${px(rect)}" role="group" aria-label="${label}, empty">${emptyLabel ? `<span class="zlabel">${emptyLabel}</span>` : ''}</div>`;
    return `<div class="slot" style="${px(rect)}" role="group" aria-label="${label}">${cardHTML(c, [0, 0, rect[2], rect[3]], g)}</div>`;
  }

  /* ---------- Midline ---------- */
  function midline(m, g) {
    const r = g.mid; const c0 = g.midCentre[0] - r[0], c1 = g.midCentre[1] - r[0];
    const steps = m.battle
      ? [['Main', 'past'], ['Battle:', 'grp'], ...['Attack', 'Block', 'Counter', 'Damage'].map((s) => [s, s === m.battle ? 'cur' : (['Attack', 'Block', 'Counter', 'Damage'].indexOf(s) < ['Attack', 'Block', 'Counter', 'Damage'].indexOf(m.battle) ? 'past' : 'fut')])]
      : ['Refresh', 'Draw', 'DON!!', 'Main', 'End'].map((s, i, a) => [s, s === m.phase ? 'cur' : (i < a.indexOf(m.phase) ? 'past' : 'fut')]);
    const lis = [];
    steps.forEach(([s, k], i) => {
      if (i && k !== 'grp' && steps[i - 1][1] !== 'grp') lis.push('<li class="sep" aria-hidden="true">›</li>');
      if (k === 'grp') { lis.push('<li class="sep" aria-hidden="true">›</li>'); lis.push(`<li class="grp">${s}</li>`); return; }
      lis.push(`<li class="${k === 'cur' ? 'cur' + (m.opp ? ' opp' : '') : k === 'fut' ? 'fut' : ''}" ${k === 'cur' ? 'aria-current="step"' : ''}>${k === 'cur' ? '▸ ' : ''}${s}</li>`);
    });
    return `<div class="z midline" style="${px(r)}" role="group" aria-label="Turn and phase">
      <div class="ml-left">${m.left || ''}</div>
      <div class="ml-centre" style="left:${c0}px;width:${c1 - c0}px">${m.oppTag ? '<span class="chip opp">Opponent</span>' : ''}<span class="turnword">${m.turn}</span><ol class="steps" aria-label="Phase">${lis.join('')}</ol></div>
      <div class="ml-right">${m.right || ''}</div></div>`;
  }

  /* ---------- Rail ---------- */
  function railHead() {
    return `<div class="railsec railhead" style="top:0;height:var(--rh)">
      <button class="iconbtn" type="button" aria-label="Game menu: Concede, Rematch, Settings" title="Game menu">≡</button>
      <a class="iconbtn lbl" href="16-settings.html#rules" aria-label="Rules reference">Rules</a>
      <a class="iconbtn" href="16-settings.html" aria-label="Settings" title="Settings">⚙</a>
      <button class="iconbtn" type="button" aria-label="Fullscreen" title="Fullscreen">⤢</button>
      <a class="iconbtn" href="index.html" aria-label="Wireframe index" title="Wireframe index (not product UI)">⌂</a>
      <button class="fan-note" type="button" title="Unofficial fan tool. One Piece and all card names, text and art belong to their respective owners." aria-label="Unofficial fan tool. One Piece and all card names, text and art belong to their respective owners.">Unofficial fan tool ⓘ</button>
    </div>`;
  }
  function logHTML(lines, top, h, ticker) {
    return `<section class="railsec log" style="top:${top}px;height:${h}px" aria-label="Event log">
      <div class="lh" ${ticker ? 'hidden' : ''}><span>Event log</span><span class="subtle" style="font-weight:500">newest at bottom</span></div>
      <div role="log" aria-live="off" aria-label="Game history" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden"><ol>${(lines || []).map((l) => (l.startsWith('<li') ? l : `<li>${l}</li>`)).join('')}</ol></div></section>`;
  }
  function coachStrip(s = {}) {
    // Collapsed strip: each button shows its live state as a word, so nothing the coach knows hides behind the collapse (board.md §3.13)
    const b = (k, t, key, def) => {
      const v = s[k] || def; const cls = s[k + 'Cls'] || '';
      const kk = key ? ` (${key})` : '';
      return `<button type="button" class="cbtn ${cls}" aria-label="${t}: ${v.replace(/<[^>]+>/g, '')}${kk}" title="${t}${kk}"><span class="t">${t}</span><span class="v">${v}</span></button>`;
    };
    return `<div class="coachstrip">${b('hint', 'Hint', 'H', 'ask')}${b('why', 'Why', 'W', 'last move')}${b('lethal', 'Lethal', 'L', 'Ask me')}${b('don', 'DON!! math', 'M', 'on')}${b('tempo', 'Tempo', '', '—')}
      <button type="button" class="cbtn chev" aria-label="Open coach (C)" aria-expanded="false" title="Open coach (C)"><span class="t" aria-hidden="true">▴</span><span class="v"><kbd>C</kbd></span></button></div>`;
  }
  function coachHTML(cfg, top, h) {
    if (cfg.coach === 'collapsed' || !cfg.coach) return `<aside class="railsec coach" style="top:${top}px;height:${h}px" aria-label="Coach">${coachStrip(cfg.coachStrip)}</aside>`;
    return `<aside class="railsec coach" style="top:${top}px;height:${h}px" aria-label="Coach">
      <div class="row" style="height:32px;padding:0 6px 0 12px;flex:none;border-bottom:1px solid var(--color-line)"><b style="font-size:var(--text-sm)">Coach</b><span class="chip outline">${cfg.verbosity || 'Standard'}</span><span style="margin-left:auto"></span><button class="iconbtn" type="button" aria-label="Collapse coach (C)" aria-expanded="true" title="Collapse coach (C)">▾</button></div>
      <div class="coachbody" tabindex="0">${cfg.coachHtml || ''}</div></aside>`;
  }
  function decisionHTML(d, g, top) {
    const [hh, bh, fh] = g.dParts;
    return `<section class="railsec decision" style="top:${top}px;height:${g.decision[1]}px" aria-label="Decision panel">
      <div class="dhead" style="height:${hh}px"><h2>${d.title}</h2>${d.q === false ? '' : '<button class="q" type="button" aria-label="Explain this step" title="Explain this step">?</button>'}</div>
      <div class="dbody" tabindex="0" style="height:${bh}px">${d.body || ''}</div>
      <div class="dfoot" style="height:${fh}px">${d.foot || ''}</div></section>`;
  }

  /* ---------- Arrows ---------- */
  function arrowSVG(list, R, W, H) {
    if (!list || !list.length) return '';
    const centre = (k) => { const r = R[k]; return r ? [r[0] + r[2] / 2, r[1] + r[3] / 2] : null; };
    let paths = '';
    list.forEach((a, i) => {
      const f = centre(a.from), t = centre(a.to);
      if (!f || !t) return;
      const col = a.color === 'opp' ? 'var(--color-opponent)' : 'var(--color-attack)';
      const mx = (f[0] + t[0]) / 2 + (a.bend || 0), my = (f[1] + t[1]) / 2;
      // stop short of the target centre so the ⌖ stays visible
      const dx = t[0] - mx, dy = t[1] - my, L = Math.hypot(dx, dy) || 1, cut = a.cut ?? 30;
      const tx = t[0] - (dx / L) * cut, ty = t[1] - (dy / L) * cut;
      paths += `<defs><marker id="ah${i}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker></defs>
        <path d="M${f[0]},${f[1]} Q${mx},${my} ${tx},${ty}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round" ${a.dashed ? 'stroke-dasharray="10 8"' : ''} marker-end="url(#ah${i})"/>
        <circle cx="${t[0]}" cy="${t[1]}" r="13" fill="var(--color-plate)" stroke="${col}" stroke-width="2"/><text x="${t[0]}" y="${t[1] + 5}" text-anchor="middle" fill="${col}" font-size="16" font-weight="700">⌖</text>`;
      if (a.label) {
        const tt = a.labelAt ?? 0.5, lx = (1 - tt) ** 2 * f[0] + 2 * (1 - tt) * tt * mx + tt * tt * tx, ly = (1 - tt) ** 2 * f[1] + 2 * (1 - tt) * tt * my + tt * tt * ty;
        paths += `<g><rect x="${lx - a.label.length * 3.6 - 8}" y="${ly - 12}" width="${a.label.length * 7.2 + 16}" height="22" rx="4" fill="var(--color-plate)" stroke="var(--color-attack)"/><text x="${lx}" y="${ly + 4}" text-anchor="middle" fill="#fff" font-size="12" font-weight="600" font-family="Inter, system-ui">${esc(a.label)}</text></g>`;
      }
    });
    return `<svg class="arrows" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${paths}</svg>`;
  }

  /* ---------- Board ---------- */
  function renderBoard(el, cfg, opt = {}) {
    const roomy = opt.density ? opt.density === 'roomy' : isRoomy();
    const g = roomy ? G.roomy : G.compact;
    const R = {};
    const [cw, ch] = g.card;
    el.classList.toggle('roomy', roomy);
    el.classList.toggle('face-scan', cfg.face === 'scan');
    el.style.setProperty('--card-w', cw + 'px');
    el.style.setProperty('--rh', g.railHead + 'px');
    if (opt.density === 'compact') el.style.cssText += ';--badge-power-size:14px;--badge-num-size:13px;--badge-h:20px;--badge-inset:2px;';
    const o = cfg.opp, m = cfg.me;
    let h = `<div class="mat" style="${px(g.mat)}"></div>`;
    h += `<div role="application" aria-roledescription="game board" aria-label="${esc(cfg.boardLabel || 'Game board')}">`;

    // Opponent strip
    h += `<div class="z oppid" style="${px(g.oppId)}" role="group" aria-label="Opponent identity"><span class="chip opp">Opp</span><span class="nmx">${o.idText || 'Kaido · Pirate AI'}</span>${o.status ? `<span class="chip outline" style="color:var(--color-opponent-text);border-color:var(--color-opponent)">${o.status}</span>` : ''}</div>`;
    const ohn = o.hand ?? 5; const known = o.known || [];
    let oh = `<div class="z opphand" style="${px(g.oppHand)}" role="group" aria-label="Opponent's hand, ${ohn} cards${known.length ? '; known: ' + known.join(', ') : ''}">`;
    const bw = Math.round(cw * 0.4), bhh = Math.round(ch * 0.4), ox = g.oppHand[2] / 2 - (ohn * (bw + 4)) / 2;
    for (let i = 0; i < ohn; i++) oh += `<span class="back peek" style="left:${ox + i * (bw + 4)}px;width:${bw}px;height:${bhh}px;top:${g.oppHand[3] - bhh - 4}px" aria-hidden="true"></span>`;
    oh += `<span class="cnt">${ohn} card${ohn === 1 ? '' : 's'}${known.length ? `&nbsp;<span class="chip outline" style="margin-left:4px" title="Known: ${known.join(', ')}">${known.length} known</span>` : ''}</span></div>`;
    h += oh;

    const side = (p, pre, mine) => {
      const L = mine ? 'Your' : 'Opponent’s';
      let s = '';
      s += donDeck(`${L} DON!! deck`, p.donDeck ?? 0, g[pre + 'DonDeck'], g);
      s += costArea(mine ? 'me' : 'opp', g[pre + 'Cost'], g, p);
      s += lifeZone(`${L} Life`, p.life === undefined ? 5 : p.life, g[pre + 'Life'], g, mine);
      R[(mine ? 'me' : 'opp') + '.life'] = g[pre + 'Life'];
      s += slotHTML(p.leader, g[pre + 'Leader'], g, `${L} Leader`);
      R[(mine ? 'me' : 'opp') + '.leader'] = g[pre + 'Leader'];
      s += slotHTML(p.stage, g[pre + 'Stage'], g, `${L} Stage`, 'Stage');
      R[(mine ? 'me' : 'opp') + '.stage'] = g[pre + 'Stage'];
      R[(mine ? 'me' : 'opp') + '.cost'] = g[pre + 'Cost'];
      R[(mine ? 'me' : 'opp') + '.deck'] = g[pre + 'Deck'];
      R[(mine ? 'me' : 'opp') + '.trash'] = g[pre + 'Trash'];
      s += deckZone(`${L} deck`, p.deck ?? 40, g[pre + 'Deck'], g, (p.deck ?? 40) <= 5);
      s += trashZone(`${L} trash`, p.trash || { n: 0 }, g[pre + 'Trash'], g);
      const cy = mine ? g.myCharY : g.oppCharY;
      const chars = p.chars || [];
      const allEmpty = chars.every((c) => !c);
      s += `<div role="group" aria-label="${L} Characters">`;
      for (let i = 0; i < 5; i++) {
        const r = [g.charX[i], cy, g.slot, g.slot];
        R[(mine ? 'me' : 'opp') + '.c' + (i + 1)] = r;
        s += slotHTML(chars[i], r, g, `${L} Character slot ${i + 1}`, allEmpty && i === 2 ? 'Character area' : '');
      }
      s += '</div>';
      return s;
    };
    h += side(o, 'opp', false);
    h += midline(cfg.mid || {}, g);
    h += side(m, 'my', true);

    // Hand
    const hand = m.hand || [];
    const hr = g.myHand;
    const n = hand.length;
    let pitch = cw + g.handGap;
    if (n > g.handMax) pitch = (hr[2] - cw) / (n - 1);
    const total = n ? cw + (n - 1) * pitch : 0;
    const startX = g.axis - total / 2;
    let hh = `<div class="z" role="group" aria-label="Your hand, ${n} cards" style="left:0;top:0;width:0;height:0">`;
    hand.forEach((c, i) => {
      const r = [startX + i * pitch, hr[1], cw, ch];
      R['me.hand.' + (i + 1)] = r;
      hh += cardHTML({ ...c, inHand: true }, r, g);
    });
    h += hh + '</div>';
    if (cfg.boardExtra) h += cfg.boardExtra(g, R);
    h += '</div>'; // application

    h += arrowSVG(cfg.arrows, R, g.mat[2], g.mat[3]);

    if (!opt.boardOnly) {
      const cs = cfg.coach || 'collapsed';
      const [lt, lh] = g.log[cs];
      const [ct, chh] = g.coachZ[cs];
      h += `<div class="rail" style="${px(g.rail)}">`;
      h += railHead();
      h += logHTML(cs === 'tall' ? (cfg.log || []).filter((l) => !l.includes('class="th"')).slice(-3) : cfg.log, lt, lh, cs === 'tall');
      h += coachHTML(cfg, ct, chh);
      h += decisionHTML(cfg.decision || { title: '' }, g, g.decision[0]);
      h += '</div>';
      if (cfg.extra) h += cfg.extra(g, R);
    }
    el.innerHTML = h;
    el.style.width = (opt.boardOnly ? g.mat[2] : g.W) + 'px';
    el.style.height = g.H + 'px';
    return { g, R };
  }

  /* ---------- Page helpers ---------- */
  function state() { return (location.hash || '').replace('#', '') || null; }
  function statesBar(list, label) {
    const cur = state() || list[0][0];
    const bar = document.createElement('nav');
    bar.className = 'wf-states';
    bar.setAttribute('aria-label', 'Wireframe states (not product UI)');
    bar.innerHTML = `<span style="color:#f2c94c">${label || 'Wireframe states'}</span>` + list.map(([k, t]) => `<a href="#${k}" ${k === cur ? 'aria-current="true"' : ''}>${t}</a>`).join('') + '<a href="index.html">Index</a>';
    document.body.appendChild(bar);
    document.addEventListener('keydown', (e) => { if (e.key === '`') bar.classList.toggle('show'); });
    if (new URLSearchParams(location.search).has('states')) bar.classList.add('show');
    window.addEventListener('hashchange', () => { bar.querySelectorAll('a').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + (state() || list[0][0]) ? 'true' : 'false')); });
  }
  function mountBoard(fn, states) {
    const stage = document.querySelector('.stage');
    const draw = () => {
      const st = state() || (states && states[0][0]);
      const cfg = fn(st);
      renderBoard(stage, cfg);
      if (cfg.after) cfg.after(stage);
      document.title = (cfg.pageTitle || document.title.split(' · ')[0]) + (st && states ? ' · ' + st : '');
    };
    draw();
    window.addEventListener('hashchange', draw);
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 100); });
    if (states) statesBar(states);
  }

  // Shared footer and header for non-board pages
  const DISCLAIMER = 'Unofficial fan tool. Not affiliated with or endorsed by Bandai, Shueisha or Toei Animation. One Piece and all card names, text and art belong to their respective owners.';
  function chrome(current) {
    const nav = [['01-welcome.html', 'Home'], ['02-setup.html', 'Play'], ['15-tutorial.html', 'Learn'], ['14-drill-lethal.html', 'Drills'], ['12-deck-builder.html', 'Decks'], ['13-meta.html', 'Meta'], ['11b-review.html', 'Reviews']];
    const header = document.querySelector('header.app-header');
    if (header) header.innerHTML = `<a class="wordmark" href="01-welcome.html"><span class="mark" aria-hidden="true"></span>OPTCG Sim</a>
      <nav class="app-nav" aria-label="Main">${nav.map(([h, t]) => `<a href="${h}" ${t === current ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <span class="spacer"></span>
      <a class="btn ghost small" href="16-settings.html#rules">Help <kbd>?</kbd></a>
      <a class="btn ghost small" href="16-settings.html" ${current === 'Settings' ? 'aria-current="page"' : ''}>Settings</a>
      <a class="btn ghost small" href="index.html" title="Wireframe index (not product UI)">Index</a>`;
    const footer = document.querySelector('footer.app-footer');
    if (footer) footer.innerHTML = `<span>${DISCLAIMER}</span><span class="spacer"></span><a href="16-settings.html#about">About and sources</a>`;
  }

  window.WF = { G, cardHTML, renderBoard, mountBoard, statesBar, state, chrome, esc, isRoomy, DISCLAIMER };
})();
