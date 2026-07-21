import { PANEL_GROUPS } from '#tmux-keybindings/domain/keybinding-profile';
import { DialogPalette } from '#tmux-keybindings/presentation/terminal/dialog-palette';
import { StyledSegment } from '#tmux-keybindings/presentation/terminal/styled-segment';
import { TerminalLine } from '#tmux-keybindings/presentation/terminal/terminal-line';

const minimumWidth = 20;
const minimumHeight = 4;
const shortcutWidth = 20;

export class BindingsPanelRenderer {
	render(width: number, height: number): string {
		const safeWidth = Math.max(minimumWidth, width);
		const safeHeight = Math.max(minimumHeight, height);
		const palette = DialogPalette.tmux();
		const contentRows = this.contentRows(safeWidth, palette);
		const footer = this.footer(palette);
		const visibleRows = this.visibleRows(contentRows, footer, safeHeight, palette);

		return visibleRows.map((segments) => TerminalLine.from(segments, safeWidth, palette.background).render()).join('\n');
	}

	private contentRows(width: number, palette: DialogPalette): readonly (readonly StyledSegment[])[] {
		const rows: (readonly StyledSegment[])[] = [
			this.title(width, palette),
			this.text('available commands and configured shortcuts', palette.mutedText, palette),
			this.text('', palette.primaryText, palette),
		];

		for (const [groupIndex, group] of PANEL_GROUPS.entries()) {
			if (groupIndex > 0) {
				rows.push(this.text('', palette.primaryText, palette));
			}

			rows.push(this.text(group.title.toLowerCase(), palette.sectionHeading, palette, true));

			for (const binding of group.bindings) {
				rows.push([
					StyledSegment.from(binding.chord.padEnd(shortcutWidth), palette.shortcut, palette.background, false),
					StyledSegment.from(binding.description, palette.primaryText, palette.background, false),
				]);
			}
		}

		return rows;
	}

	private title(width: number, palette: DialogPalette): readonly StyledSegment[] {
		const title = 'tmux keybindings';
		const badge = 'esc close';
		const spacing = ' '.repeat(Math.max(1, width - Array.from(title).length - Array.from(badge).length));

		return [
			StyledSegment.from(title, palette.primaryText, palette.background, true),
			StyledSegment.from(spacing, palette.primaryText, palette.background, false),
			StyledSegment.from(badge, palette.closeBadgeText, palette.closeBadgeBackground, true),
		];
	}

	private footer(palette: DialogPalette): readonly StyledSegment[] {
		return this.text('toggle Option+Command+T  close Esc', palette.mutedText, palette);
	}

	private visibleRows(contentRows: readonly (readonly StyledSegment[])[], footer: readonly StyledSegment[], height: number, palette: DialogPalette): readonly (readonly StyledSegment[])[] {
		const contentHeight = height - 1;
		const visible = contentRows.slice(0, contentHeight);

		if (contentRows.length > contentHeight) {
			visible[visible.length - 1] = this.text('... resize dialog to see all bindings', palette.mutedText, palette);
		}

		while (visible.length < contentHeight) {
			visible.push(this.text('', palette.primaryText, palette));
		}

		return [...visible, footer];
	}

	private text(value: string, foreground: string, palette: DialogPalette, emphasized = false): readonly StyledSegment[] {
		return [StyledSegment.from(value, foreground, palette.background, emphasized)];
	}
}
