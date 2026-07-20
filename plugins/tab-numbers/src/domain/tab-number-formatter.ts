export class TabNumberFormatter {
  private static readonly managedSuffixPattern = /(?: · \d+)+$/u;
  private static readonly numericLabelPattern = /^\d+$/u;

  format(label: string, number: number): string {
    const baseLabel = label.replace(TabNumberFormatter.managedSuffixPattern, '');

    if (baseLabel.length === 0 || TabNumberFormatter.numericLabelPattern.test(baseLabel)) {
      return baseLabel;
    }

    return `${baseLabel} · ${number}`;
  }
}
