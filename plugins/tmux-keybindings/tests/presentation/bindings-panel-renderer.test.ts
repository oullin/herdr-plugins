import { describe, expect, it } from 'vite-plus/test';

import { BindingsPanelRenderer } from '#tmux-keybindings/presentation/bindings-panel-renderer';

describe('BindingsPanelRenderer', () => {
	const renderer = new BindingsPanelRenderer();

	it('renders every group in a narrow pane', () => {
		const panel = renderer.render(42, 30);

		expect(panel).toContain('Option+Command+T');
		expect(panel).toContain('Esc closes');
		expect(panel).toContain('GLOBAL');
		expect(panel).toContain('TABS');
		expect(panel).toContain('PANES');
		expect(panel).toContain('% / "');
		expect(
			panel.split('\n').every((line) => line.length <= 42),
		).toBe(true);
	});

	it('uses two columns in a wide pane', () => {
		const panel = renderer.render(90, 20);

		expect(panel).toContain('│');
		expect(panel).toContain('GLOBAL');
		expect(panel).toContain('PANES');
	});

	it('adds an overflow hint at short heights', () => {
		const panel = renderer.render(38, 6);

		expect(
			panel.split('\n'),
		).toHaveLength(5);
		expect(panel).toContain('resize dialog');
	});
});
