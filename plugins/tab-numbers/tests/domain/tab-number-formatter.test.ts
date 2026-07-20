import { describe, expect, it } from 'vite-plus/test';

import { TabNumberFormatter } from '../../src/domain/tab-number-formatter.ts';

describe('TabNumberFormatter', () => {
  const formatter = new TabNumberFormatter();

  it.each([
    ['skills', 1, 'skills · 1'],
    ['gocanto.sh', 5, 'gocanto.sh · 5'],
    ['oullin-web', 7, 'oullin-web · 7'],
    ['研究', 3, '研究 · 3'],
    ['développement', 12, 'développement · 12'],
  ])('formats %s with stable tab number %i', (label, number, expected) => {
    expect(formatter.format(label, number)).toBe(expected);
  });

  it('leaves numeric auto-generated labels untouched', () => {
    expect(formatter.format('7', 7)).toBe('7');
  });

  it('normalizes duplicate and stale managed suffixes', () => {
    expect(formatter.format('skills · 99 · 4', 1)).toBe('skills · 1');
  });

  it('removes a managed suffix when the base becomes numeric', () => {
    expect(formatter.format('7 · 2', 7)).toBe('7');
  });
});
