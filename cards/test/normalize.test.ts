import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assemble, type SourcedRow } from '../scripts/build.ts';
import {
  cleanText,
  normalizeMinus,
  parseAttributes,
  parseColors,
  printedKeywords,
  repairSigns,
  restoreTriggerMarker,
  rowProblems,
  selfSignSuspects,
  splitTrigger,
  stripName,
  type RawRow,
} from '../scripts/normalize.ts';
import { TypeVocabulary } from '../scripts/types-vocab.ts';

// Real optcgapi.com rows recorded on 2026-10-28 (prices removed). No network in tests.
const FIXTURE = JSON.parse(
  readFileSync(new URL('./fixtures/optcgapi-rows.json', import.meta.url), 'utf8'),
) as (RawRow & { file: SourcedRow['file'] })[];
const row = (imageId: string, file?: string) =>
  FIXTURE.find((r) => r.card_image_id === imageId && (!file || r.file === file))!;
const M = '−';

describe('sign repair (Track B: 13 OP-17 cards lost a minus)', () => {
  it('restores DON!! costs followed by a colon, a comma or the reminder text', () => {
    expect(repairSigns('[On Play] DON!! 1: If your Leader').text).toBe(
      `[On Play] DON!! ${M}1: If your Leader`,
    );
    expect(repairSigns('[On Play] DON!! 1, You may trash').text).toBe(
      `[On Play] DON!! ${M}1, You may trash`,
    );
    const fromRow = repairSigns(cleanText(row('OP08-060').card_text).text);
    expect(fromRow.text).toContain(`DON!! ${M}1 (You may return`);
    expect(fromRow.fixes).toEqual([
      { field: 'effectText', kind: 'sign', from: 'DON!! 1', to: `DON!! ${M}1` },
    ]);
  });

  it('never touches [DON!! x1] conditions or "DON!! cards"', () => {
    const t = '[DON!! x1] [When Attacking] Add up to 1 DON!! card from your DON!! deck.';
    expect(repairSigns(t).fixes).toEqual([]);
  });

  it("restores unsigned power and cost given to an opponent's card", () => {
    const power = repairSigns(cleanText(row('OP17-042').card_text).text);
    expect(power.text).toContain(`opponent's Characters ${M}3000 power`);
    const cost = repairSigns(cleanText(row('OP17-097').card_text).text);
    expect(cost.text).toContain(`opponent's Characters ${M}1 cost during this turn`);
    expect(cost.fixes.map((f) => f.kind)).toEqual(['sign']);
  });

  it('leaves thresholds and already-signed values alone', () => {
    const t =
      "K.O. up to 1 of your opponent's Characters with 4000 power or less. Give up to 1 of your opponent's Characters −2000 power.";
    expect(repairSigns(t).fixes).toEqual([]);
    expect(repairSigns("Give up to 1 of your opponent's 0 cost Characters 3000 power").text).toBe(
      `Give up to 1 of your opponent's 0 cost Characters ${M}3000 power`,
    );
  });

  it('does not repair self-directed values but flags them (effect-dsl E-Q8)', () => {
    const sabo = cleanText(row('OP13-004').card_text).text;
    expect(repairSigns(sabo).text).toContain('give this Leader 1000 power');
    expect(selfSignSuspects(sabo)).toEqual(['give this Leader 1000 power']);
    // "…by your opponent's effect, you may give your Leader 2000 power": your Leader, not theirs.
    const mixed = repairSigns(cleanText(row('OP14-016').card_text).text);
    expect(mixed.text).toContain('give your Leader 2000 power during this turn instead');
    expect(mixed.text).toContain(`opponent's Characters ${M}2000 power during this turn.`);
    expect(mixed.fixes).toHaveLength(1);
  });
});

describe('cleanup', () => {
  it('turns NULL text into an empty effect, with an audit entry', () => {
    const r = cleanText(row('ST12-015').card_text);
    expect(r.text).toBe('');
    expect(r.fixes[0]).toMatchObject({ kind: 'cleanup', from: 'NULL', to: '' });
    expect(cleanText(null).text).toBe('');
  });

  it('removes appended reprint disclaimers', () => {
    const r = cleanText(row('ST16-005_r1').card_text);
    expect(r.text).not.toMatch(/disclaimer/i);
    expect(r.text).toBe(cleanText(row('ST16-005').card_text).text);
    expect(r.fixes[0]!.from).toMatch(/^Disclaimer: This card was reprinted/);
  });

  it('removes the "officially errata\'d" note', () => {
    const r = cleanText(row('OP01-017').card_text);
    expect(r.text).not.toContain("errata'd");
    expect(r.fixes[0]!.from).toBe("This card has been officially errata'd.");
  });

  it('normalizes whitespace and minus glyphs without changing meaning', () => {
    expect(cleanText('  a   b \r\n\r\n\r\nc ').text).toBe('a b\n\nc');
    expect(normalizeMinus('Characters –2 cost; DON!! -1; Gum-Gum; +1000')).toBe(
      `Characters ${M}2 cost; DON!! ${M}1; Gum-Gum; +1000`,
    );
    expect(cleanText(row('OP09-089').card_text).text).toContain(`${M}2 cost`);
  });
});

describe('trigger split', () => {
  it("splits the card's own [Trigger] at the last ability start", () => {
    const t = splitTrigger(cleanText(row('OP08-106').card_text).text);
    expect(t.effect).toMatch(/^\[On Play\] You may trash 1 card with a \[Trigger\] from your hand/);
    expect(t.trigger).toBe("Activate this card's [On Play] effect.");
  });

  it('keeps a [Trigger] mentioned inside a sentence in the effect', () => {
    const t = splitTrigger(cleanText(row('OP09-062').card_text).text);
    expect(t.trigger).toBeNull();
    expect(t.effect).toContain('trash 1 card with a [Trigger] from your hand');
  });

  it('handles a card whose only text is a trigger', () => {
    expect(splitTrigger(cleanText(row('OP12-112').card_text).text)).toEqual({
      effect: '',
      trigger: 'If your Leader is multicolored, draw 2 cards.',
    });
  });

  it('restores a bare "Trigger" marker (OP17-104)', () => {
    const marked = restoreTriggerMarker(cleanText(row('OP17-104').card_text).text);
    expect(marked.fixes).toHaveLength(1);
    expect(splitTrigger(marked.text).trigger).toBe('Play this card.');
  });
});

describe('name suffixes', () => {
  it('strips printing suffixes and keeps them as a label', () => {
    expect(stripName('Charlotte Linlin (099)')).toEqual({ name: 'Charlotte Linlin' });
    expect(stripName('Usopp (042) (Alternate Art)')).toEqual({
      name: 'Usopp',
      label: 'Alternate Art',
    });
    expect(stripName('Nami - P-117')).toEqual({ name: 'Nami' });
    expect(stripName('Monkey.D.Luffy (091) (Offline Regional 2024 Vol. 3) [Finalist]')).toEqual({
      name: 'Monkey.D.Luffy',
      label: 'Offline Regional 2024 Vol. 3 · Finalist',
    });
    expect(stripName('Jinbe - PRB02-007(Alternate Art)').name).toBe('Jinbe');
  });

  it('keeps parentheses that belong to the name', () => {
    expect(stripName('Mr.3(Galdino)').name).toBe('Mr.3(Galdino)');
    expect(stripName('Eustass"Captain"Kid (Parallel)').name).toBe('Eustass"Captain"Kid');
  });
});

describe('shifted columns', () => {
  it('rejects a row whose types sit in the power column (OP17-099)', () => {
    expect(rowProblems(row('OP17-099'))).toContain('power "The Four Emperors Big Mom Pirates"');
  });

  it('rejects a row whose types sit in the cost column (OP12-018)', () => {
    expect(rowProblems(row('OP12-018', 'sets'))).toContain('cost "Former Roger Pirates"');
  });

  it('rejects promo rows shifted one column over, and keeps the base row', () => {
    const promo = FIXTURE.find((r) => r.card_set_id === 'OP11-004' && r.file === 'promos')!;
    expect(rowProblems(promo)).toEqual(
      expect.arrayContaining(['power "Navy SWORD"', 'types "1000"']),
    );
    expect(rowProblems(row('OP11-004', 'sets'))).toEqual([]);
  });

  it('rejects colors that are not colors (OP04-095_r1)', () => {
    expect(parseColors(row('OP04-095_r1').card_color)).toBeNull();
    expect(rowProblems(row('OP04-095_r1'))).toContain('colors "Character"');
    expect(parseColors('Blue Purple')).toEqual(['Blue', 'Purple']);
  });

  it('drops junk attributes', () => {
    expect(parseAttributes('NULL')).toEqual({ attributes: [], dropped: ['NULL'] });
    expect(parseAttributes('Straw Hat Crew ODYSSEY').attributes).toEqual([]);
    expect(parseAttributes('Slash / Special').attributes).toEqual(['Slash', 'Special']);
    expect(parseAttributes(null)).toEqual({ attributes: [], dropped: [] });
  });
});

describe('type splitting', () => {
  const vocab = new TypeVocabulary(
    [
      'Straw Hat Crew',
      'The Four Emperors',
      'Navy',
      'Neo Navy',
      'FILM',
      'Giant/Elbaph',
      'Mountain Bandits',
      'Animal Kingdom Pirates',
    ],
    [],
  );

  it('splits an undelimited string against the vocabulary, longest types intact', () => {
    expect(vocab.split('Straw Hat Crew The Four Emperors Elbaph')).toEqual({
      ok: true,
      types: ['Straw Hat Crew', 'The Four Emperors', 'Elbaph'],
    });
    expect(vocab.split('Film Neo Navy')).toEqual({ ok: true, types: ['FILM', 'Neo Navy'] });
    expect(vocab.split('Dressrosa/Barto Club')).toEqual({
      ok: true,
      types: ['Dressrosa', 'Barto Club'],
    });
  });

  it('fails on a string with more than one valid split', () => {
    // "Neo Navy" and "Neo" are both confirmed by delimited rows, so "Neo Navy" splits two ways.
    const v = new TypeVocabulary(['Neo Navy/FILM', 'Neo/Animal', 'Navy/Giant'], []);
    const r = v.split('Neo Navy');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('ambiguous');
  });

  it('fails on a string that may hide an unknown type, instead of guessing', () => {
    // "Hawkins Pirates" never appears alone, so "Animal Kingdom Pirates Hawkins Pirates" looks like one type.
    const v = new TypeVocabulary(
      ['Animal Kingdom Pirates', 'Animal Kingdom Pirates Hawkins Pirates'],
      [],
    );
    const r = v.split('Animal Kingdom Pirates Hawkins Pirates');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unmatched');
    // With the missing type in the addendum, the split is unique.
    const fixed = new TypeVocabulary(
      ['Animal Kingdom Pirates', 'Animal Kingdom Pirates Hawkins Pirates'],
      [{ type: 'Hawkins Pirates', source: 'test' }],
    );
    expect(fixed.split('Animal Kingdom Pirates Hawkins Pirates')).toEqual({
      ok: true,
      types: ['Animal Kingdom Pirates', 'Hawkins Pirates'],
    });
  });

  it('fails on a type it has never seen', () => {
    expect(vocab.split('Totally Unknown').ok).toBe(false);
  });
});

describe('printed keywords (E-D7 check)', () => {
  it('finds keywords that start an ability, not ones granted by an effect', () => {
    expect(printedKeywords(cleanText(row('OP09-062').card_text).text)).toEqual(['Banish']);
    expect(printedKeywords('[Rush: Character]\n[When Attacking] …')).toEqual(['Rush: Character']);
    expect(
      printedKeywords('[Blocker] (After your opponent declares an attack…) [Double Attack]'),
    ).toEqual(['Blocker', 'Double Attack']);
    expect(
      printedKeywords('All of your Characters with a cost of 12 or more gain [Blocker].'),
    ).toEqual([]);
    expect(printedKeywords('[DON!! x1] This Character gains [Rush].')).toEqual([]);
  });
});

describe('assembly: printings reconciled by card number', () => {
  const rows = FIXTURE.map((r) => ({ ...r, fetchedAt: '2026-10-28T13:47:17.000Z' }));
  const vocab = new TypeVocabulary(
    rows
      .filter((r) => rowProblems(r).length === 0)
      .map((r) => r.sub_types ?? '')
      .filter(Boolean),
    [
      { type: 'Elbaph', source: 'test' },
      { type: 'SWORD', source: 'test' },
      { type: 'Navy', source: 'test' },
      { type: 'Mountain Bandits', source: 'test' },
    ],
  );
  const asm = assemble(rows, vocab);

  it('takes game fields from the base printing and rejects shifted promo rows', () => {
    const kujyaku = asm.cards.get('OP11-004')!;
    expect(kujyaku).toMatchObject({
      name: 'Kujyaku',
      cost: 1,
      power: 0,
      counter: 1000,
      types: ['Navy', 'SWORD'],
    });
    expect(asm.issues.some((i) => i.id === 'OP11-004' && i.kind === 'shifted-columns')).toBe(true);
    // Both printings stay as artworks: the promo has its own image under the same upstream id.
    expect(kujyaku.artworks.map((a) => a.artworkId)).toEqual([
      'OP11-004',
      'OP11-004_p1',
      'OP11-004#2',
    ]);
    expect(kujyaku.artworks[2]).toMatchObject({ product: 'P', label: 'Treasure Cup August 2025' });
  });

  it('demands an override when every printing is shifted', () => {
    const issue = asm.issues.find((i) => i.id === 'OP17-099' && i.kind === 'no-valid-row')!;
    expect(issue.level).toBe('fatal');
    expect(issue.fields).toEqual(expect.arrayContaining(['power', 'types']));
  });

  it('repairs the trigger, signs and junk end to end', () => {
    const c = asm.cards.get('OP08-106')!;
    expect(c.triggerText).toBe("Activate this card's [On Play] effect.");
    expect(asm.cards.get('OP17-042')!.textFixes.map((f) => f.kind)).toEqual(['sign']);
    expect(asm.cards.get('ST12-015')!.effectText).toBe('');
    expect(asm.cards.get('OP07-004')!.types).toEqual(['Mountain Bandits']);
    expect(asm.cards.get('P-030')!.artworks[0]!.artworkId).toBe('P-030_r1');
  });

  it('keeps the upstream name until an override corrects it (OP16-065 "Sakazuk")', () => {
    expect(asm.cards.get('OP16-065')!.name).toBe('Sakazuk');
  });
});
