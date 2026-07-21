import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_PANE_NAVIGATION_BINDINGS } from '#pane-navigation-hints/domain/default-keybindings';
import { NavigationHintFormatter } from '#pane-navigation-hints/domain/navigation-hint-formatter';

describe('NavigationHintFormatter', () => {
	const formatter = new NavigationHintFormatter();

	it('formats the Herdr defaults and omits the unbound last-pane action', () => {
		expect(
			formatter.format(DEFAULT_PANE_NAVIGATION_BINDINGS),
		).toBe('Ctrl+B then: Focus ←/↓/↑/→ h/j/k/l · Cycle next/prev Tab/Shift+Tab');
	});

	it('collapses the tmux profile into one compact legend', () => {
		expect(
			formatter.format({
					prefix: 'ctrl+b',
					focusPaneLeft: 'prefix+left',
					focusPaneDown: 'prefix+down',
					focusPaneUp: 'prefix+up',
					focusPaneRight: 'prefix+right',
					cyclePaneNext: 'prefix+o',
					cyclePanePrevious: 'prefix+shift+tab',
					lastPane: 'prefix+;',
				}),
		).toBe('Ctrl+B then: Focus ←/↓/↑/→ · Cycle next/prev o/Shift+Tab · Last ;');
	});

	it('renders partial and direct bindings without inventing missing actions', () => {
		expect(
			formatter.format({
					...DEFAULT_PANE_NAVIGATION_BINDINGS,
					focusPaneDown: '',
					focusPaneUp: '',
					cyclePaneNext: 'alt+n',
					cyclePanePrevious: '',
				}),
		).toBe('Focus ← Ctrl+B+h → Ctrl+B+l · Next Alt+n');
	});

	it('omits separators before collapsed bindings when the prefix is empty', () => {
		expect(
			formatter.format({
					prefix: '',
					focusPaneLeft: 'prefix+left',
					focusPaneDown: 'prefix+down',
					focusPaneUp: 'prefix+up',
					focusPaneRight: 'prefix+right',
					cyclePaneNext: 'prefix+o',
					cyclePanePrevious: 'prefix+shift+tab',
					lastPane: 'prefix+;',
				}),
		).toBe('Focus ←/↓/↑/→ · Cycle next/prev o/Shift+Tab · Last ;');
	});

	it('omits separators before individual bindings when the prefix is empty', () => {
		expect(
			formatter.format({
					prefix: '',
					focusPaneLeft: 'prefix+left',
					focusPaneDown: '',
					focusPaneUp: '',
					focusPaneRight: '',
					cyclePaneNext: 'prefix+tab',
					cyclePanePrevious: '',
					lastPane: '',
				}),
		).toBe('Focus ← ← · Next Tab');
	});

	it('reports when every pane navigation action is unbound', () => {
		expect(
			formatter.format({
					prefix: 'ctrl+b',
					focusPaneLeft: '',
					focusPaneDown: '',
					focusPaneUp: '',
					focusPaneRight: '',
					cyclePaneNext: '',
					cyclePanePrevious: '',
					lastPane: '',
				}),
		).toBe('Pane navigation is unbound');
	});

	it('never exceeds the Herdr pane title limit', () => {
		const title = formatter.format({
			...DEFAULT_PANE_NAVIGATION_BINDINGS,
			focusPaneLeft: 'ctrl+this-is-an-intentionally-long-custom-navigation-binding-left',
			focusPaneDown: 'alt+this-is-an-intentionally-long-custom-navigation-binding-down',
			focusPaneUp: 'cmd+this-is-an-intentionally-long-custom-navigation-binding-up',
			focusPaneRight: 'super+this-is-an-intentionally-long-custom-navigation-binding-right',
		});

		expect(
			Array.from(title),
		).toHaveLength(80);
		expect(
			title.endsWith('…'),
		).toBe(true);
	});
});
