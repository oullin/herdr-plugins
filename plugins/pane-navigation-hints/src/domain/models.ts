export type { Environment, Pane, PaneTitleUpdate } from '@oullin/herdr-plugin-core';

export interface PaneNavigationBindings {
	readonly prefix: string;
	readonly focusPaneLeft: string;
	readonly focusPaneDown: string;
	readonly focusPaneUp: string;
	readonly focusPaneRight: string;
	readonly cyclePaneNext: string;
	readonly cyclePanePrevious: string;
	readonly lastPane: string;
}

export interface KeybindingConfiguration {
	readonly configPath: string;
	readonly bindings: PaneNavigationBindings;
}

export interface PaneHintResult {
	readonly operation: 'cleared' | 'refreshed';
	readonly panes: number;
}
