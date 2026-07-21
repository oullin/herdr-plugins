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
		const shortcuts = this.shortcutLines(contentWidth);
		const divider = this.centre('━'.repeat(Math.min(contentWidth, 42)), contentWidth);
		const body = [header, ...shortcuts, divider, '', ...lines];
		const visible = body.slice(0, safeHeight - 1);

		if (body.length > visible.length) {
			visible[visible.length - 1] = this.truncate('… resize dialog to see all bindings', contentWidth);
		}

		return visible.map((line) => `  ${this.truncate(line, contentWidth)}`).join('\n');
	}

	private narrowLines(width: number): readonly string[] {
		return PANEL_GROUPS.flatMap((group, index) => [...(index === 0 ? [] : ['']), this.sectionHeading(group.title, width), ...group.bindings.map((binding) => this.bindingLine(binding, width))]);
	}

	private wideLines(width: number): readonly string[] {
		const columnWidth = Math.floor((width - 3) / 2);
		const columns: readonly BindingGroup[][] = [[PANEL_GROUPS[0] as BindingGroup, PANEL_GROUPS[1] as BindingGroup], [PANEL_GROUPS[2] as BindingGroup]];

		const rendered = columns.map((groups) =>
			groups.flatMap((group, index) => [...(index === 0 ? [] : ['']), this.sectionHeading(group.title, columnWidth), ...group.bindings.map((binding) => this.bindingLine(binding, columnWidth))]),
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

	private shortcutLines(width: number): readonly string[] {
		if (width >= 48) {
			return [this.centre('Open/close Option+Command+T  •  Esc closes', width)];
		}

		if (width >= 25) {
			return [this.centre('Option+Command+T', width), this.centre('Esc closes', width)];
		}

		return [this.centre('Esc closes', width)];
	}

	private sectionHeading(title: string, width: number): string {
		const heading = title.toUpperCase();
		const rule = '─'.repeat(Math.max(0, width - heading.length - 1));

		return `${heading} ${rule}`;
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
