import { describe, expect, it } from 'vite-plus/test';

import { StyledSegment } from '#tmux-keybindings/presentation/terminal/styled-segment';
import { TerminalLine } from '#tmux-keybindings/presentation/terminal/terminal-line';

describe('TerminalLine', () => {
	const escape = String.fromCodePoint(0x1b);

	it('parses six-digit colours with or without a hash', () => {
		const segment = StyledSegment.from('ok', 'c0caf5', '#1a1b26', false);
		const output = TerminalLine.from([segment], 2, '#1a1b26').render();

		expect(output).toContain(`${escape}[38;2;192;202;245mok`);
		expect(output).toContain(`${escape}[48;2;26;27;38m`);
	});

	it('falls back to black for malformed colours', () => {
		const segment = StyledSegment.from('ok', '#xyzxyz', '#abc', false);
		const output = TerminalLine.from([segment], 3, 'invalid').render();

		expect(output).not.toContain('NaN');
		expect(output).toContain(`${escape}[38;2;0;0;0mok`);
		expect(
			output.match(new RegExp(`${escape}\\[48;2;0;0;0m`, 'gu')),
		).toHaveLength(2);
	});
});
