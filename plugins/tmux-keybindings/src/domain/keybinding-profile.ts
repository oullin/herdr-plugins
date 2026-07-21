export interface KeybindingAssignment {
	readonly key: string;
	readonly value: string;
}

export interface BindingDescription {
	readonly chord: string;
	readonly description: string;
}

export interface BindingGroup {
	readonly title: string;
	readonly bindings: readonly BindingDescription[];
}

export const TOGGLE_ACTION_ID = 'oullin.tmux-keybindings.toggle';

export const PLUGIN_ID = 'oullin.tmux-keybindings';

export const PANE_ENTRYPOINT = 'bindings';

export const KEYBINDING_PROFILE: readonly KeybindingAssignment[] = [
	{ key: 'prefix', value: 'ctrl+b' },
	{ key: 'help', value: '' },
	{ key: 'detach', value: 'prefix+d' },
	{ key: 'new_tab', value: 'prefix+c' },
	{ key: 'rename_tab', value: 'prefix+comma' },
	{ key: 'next_tab', value: 'prefix+n' },
	{ key: 'previous_tab', value: 'prefix+p' },
	{ key: 'switch_tab', value: 'prefix+1..9' },
	{ key: 'close_tab', value: 'prefix+ampersand' },
	{ key: 'split_vertical', value: 'prefix+%' },
	{ key: 'split_horizontal', value: 'prefix+"' },
	{ key: 'focus_pane_left', value: 'prefix+left' },
	{ key: 'focus_pane_right', value: 'prefix+right' },
	{ key: 'focus_pane_up', value: 'prefix+up' },
	{ key: 'focus_pane_down', value: 'prefix+down' },
	{ key: 'cycle_pane_next', value: 'prefix+o' },
	{ key: 'last_pane', value: 'prefix+;' },
	{ key: 'close_pane', value: 'prefix+x' },
	{ key: 'zoom', value: 'prefix+z' },
	{ key: 'copy_mode', value: 'prefix+[' },
	{ key: 'workspace_picker', value: 'prefix+w' },
];

export const PANEL_GROUPS: readonly BindingGroup[] = [
	{
		title: 'Global',
		bindings: [
			{ chord: 'Ctrl+B', description: 'prefix' },
			{ chord: '?', description: 'open / close dialog' },
			{ chord: 'd', description: 'detach' },
			{ chord: 'w', description: 'workspace navigation' },
		],
	},
	{
		title: 'Tabs',
		bindings: [
			{ chord: 'c', description: 'new tab' },
			{ chord: ',', description: 'rename tab' },
			{ chord: 'n / p', description: 'next / previous tab' },
			{ chord: '1..9', description: 'switch tab' },
			{ chord: '&', description: 'close tab' },
		],
	},
	{
		title: 'Panes',
		bindings: [
			{ chord: '% / "', description: 'split right / down' },
			{ chord: 'arrows', description: 'focus adjacent pane' },
			{ chord: 'o', description: 'cycle panes' },
			{ chord: ';', description: 'last pane' },
			{ chord: 'x', description: 'close pane' },
			{ chord: 'z', description: 'zoom pane' },
			{ chord: '[', description: 'copy mode' },
		],
	},
];
