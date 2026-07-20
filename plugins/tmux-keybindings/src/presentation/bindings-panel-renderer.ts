import { PANEL_GROUPS, type BindingDescription, type BindingGroup } from '#tmux-keybindings/domain/keybinding-profile';

const maximumChordWidth = 12;
const minimumChordWidth = 7;
const chordWidthRatio = 0.28;

export class BindingsPanelRenderer {
	render(width: number, height: number): string {
		const safeWidth = Math.max(20, width);
		const safeHeight = Math.max(4, height);
		const contentWidth = safeWidth - 4;
		const lines = safeWidth >= 72 ? this.wideLines(contentWidth) : this.narrowLines(contentWidth);
		const header = this.centre('TMUX KEYBINDINGS', contentWidth);
		const prefix = this.centre('Ctrl+B, then key', contentWidth);
		const body = [header, prefix, '', ...lines];
		const visible = body.slice(0, safeHeight - 1);

		if (body.length > visible.length) {
			visible[visible.length - 1] = this.truncate('… resize pane to see all bindings', contentWidth);
		}

		return visible.map((line) => `  ${this.truncate(line, contentWidth)}`).join('\n');
	}

	private narrowLines(width: number): readonly string[] {
		return PANEL_GROUPS.flatMap((group, index) => [...(index === 0 ? [] : ['']), group.title.toUpperCase(), ...group.bindings.map((binding) => this.bindingLine(binding, width))]);
	}

	private wideLines(width: number): readonly string[] {
		const columnWidth = Math.floor((width - 3) / 2);
		const columns: readonly BindingGroup[][] = [[PANEL_GROUPS[0] as BindingGroup, PANEL_GROUPS[1] as BindingGroup], [PANEL_GROUPS[2] as BindingGroup]];

		const rendered = columns.map((groups) =>
			groups.flatMap((group, index) => [...(index === 0 ? [] : ['']), group.title.toUpperCase(), ...group.bindings.map((binding) => this.bindingLine(binding, columnWidth))]),
		);

		const rowCount = Math.max(...rendered.map((column) => column.length));
		const lines: string[] = [];

		for (let row = 0; row < rowCount; row += 1) {
			const left = (rendered[0]?.[row] ?? '').padEnd(columnWidth);
			const right = rendered[1]?.[row] ?? '';

			lines.push(`${left} │ ${right}`.trimEnd());
		}

		return lines;
	}

	private bindingLine(binding: BindingDescription, width: number): string {
		const chordWidth = Math.min(maximumChordWidth, Math.max(minimumChordWidth, Math.floor(width * chordWidthRatio)));

		return `${binding.chord.padEnd(chordWidth)} ${binding.description}`;
	}

	private centre(value: string, width: number): string {
		return value.padStart(Math.max(value.length, Math.floor((width + value.length) / 2)));
	}

	private truncate(value: string, width: number): string {
		if (value.length <= width) {
			return value;
		}

		return `${value.slice(0, Math.max(0, width - 1))}…`;
	}
}
