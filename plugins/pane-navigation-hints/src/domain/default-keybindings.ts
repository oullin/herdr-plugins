import type { PaneNavigationBindings } from '#pane-navigation-hints/domain/models';

export const DEFAULT_PANE_NAVIGATION_BINDINGS: PaneNavigationBindings = {
	prefix: 'ctrl+b',
	focusPaneLeft: 'prefix+h',
	focusPaneDown: 'prefix+j',
	focusPaneUp: 'prefix+k',
	focusPaneRight: 'prefix+l',
	cyclePaneNext: 'prefix+tab',
	cyclePanePrevious: 'prefix+shift+tab',
	lastPane: '',
};

export const PANE_NAVIGATION_CONFIG_KEYS = {
	prefix: 'prefix',
	focus_pane_left: 'focusPaneLeft',
	focus_pane_down: 'focusPaneDown',
	focus_pane_up: 'focusPaneUp',
	focus_pane_right: 'focusPaneRight',
	cycle_pane_next: 'cyclePaneNext',
	cycle_pane_previous: 'cyclePanePrevious',
	last_pane: 'lastPane',
} as const satisfies Readonly<Record<string, keyof PaneNavigationBindings>>;
