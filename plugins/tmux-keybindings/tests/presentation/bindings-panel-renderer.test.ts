import { describe, expect, it } from 'vite-plus/test';

import { PANEL_GROUPS } from '#tmux-keybindings/domain/keybinding-profile';
import { BindingsPanelRenderer } from '#tmux-keybindings/presentation/bindings-panel-renderer';
import { TerminalOutput } from '#tmux-keybindings/testing/support/terminal-output';

describe('BindingsPanelRenderer', () => {
	const renderer = new BindingsPanelRenderer();
	const escape = String.fromCodePoint(0x1b);

	it('renders the complete styled catalogue within the target dialog', () => {
		const panel = renderer.render(84, 30);
		const output = TerminalOutput.from(panel);
		const primary = `${escape}[38;2;192;202;245m`;
		const shortcut = `${escape}[38;2;187;154;247m`;

		expect(output.rows).toHaveLength(30);
		expect(
			output.visibleWidths.every((width) => width === 84),
		).toBe(true);
		expect(
			output.rows[0]?.startsWith('tmux keybindings'),
		).toBe(true);
		expect(
			output.rows[0]?.endsWith('esc close'),
		).toBe(true);
		expect(output.rows).toContain('available commands and configured shortcuts'.padEnd(84));
		expect(
			output.rows.at(-1)?.trim(),
		).toBe('toggle Option+Command+T  close Esc');

		for (const group of PANEL_GROUPS) {
			expect(
				output.rows.some((row) => row.trim() === group.title.toLowerCase()),
			).toBe(true);

			for (const binding of group.bindings) {
				expect(panel).toContain(binding.chord);
				expect(panel).toContain(binding.description);
				expect(
					output.hasStyledText(shortcut, binding.chord),
				).toBe(true);
				expect(
					output.hasStyledText(primary, binding.description),
				).toBe(true);
			}
		}

		expect(
			output.hasAnsiSequence(`${escape}[48;2;26;27;38m`),
		).toBe(true);
		expect(
			output.hasAnsiSequence(`${escape}[38;2;192;202;245m`),
		).toBe(true);
		expect(
			output.hasAnsiSequence(`${escape}[38;2;115;122;162m`),
		).toBe(true);
		expect(
			output.hasAnsiSequence(`${escape}[38;2;125;207;255m`),
		).toBe(true);
		expect(
			output.hasAnsiSequence(`${escape}[38;2;187;154;247m`),
		).toBe(true);
		expect(
			output.hasAnsiSequence(`${escape}[48;2;122;162;247m`),
		).toBe(true);
		expect(
			output.hasAnsiSequence(`${escape}[38;2;26;27;38m`),
		).toBe(true);
		expect(
			output.everyRowEndsWithReset(),
		).toBe(true);
	});

	it('preserves the resize hint and footer at short heights', () => {
		const output = TerminalOutput.from(renderer.render(84, 6));

		expect(output.rows).toHaveLength(6);
		expect(
			output.rows.some((row) => row.includes('... resize dialog to see all bindings')),
		).toBe(true);
		expect(
			output.rows.at(-1)?.trim(),
		).toBe('toggle Option+Command+T  close Esc');
		expect(
			output.everyRowEndsWithReset(),
		).toBe(true);
	});

	it('keeps narrow and minimum-height output within the safe viewport', () => {
		const output = TerminalOutput.from(renderer.render(12, 2));

		expect(output.rows).toHaveLength(4);
		expect(
			output.visibleWidths.every((width) => width <= 20),
		).toBe(true);
		expect(
			output.rows.some((row) => row.includes('resize dialog')),
		).toBe(true);
		expect(
			output.everyRowEndsWithReset(),
		).toBe(true);
	});
});
