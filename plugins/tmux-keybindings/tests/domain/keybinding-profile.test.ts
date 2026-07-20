import { describe, expect, it } from 'vite-plus/test';

import { KEYBINDING_PROFILE, TOGGLE_ACTION_ID } from '#tmux-keybindings/domain/keybinding-profile';

describe('keybinding profile', () => {
	it('maps the canonical tmux profile onto Herdr actions', () => {
		expect(
			Object.fromEntries(KEYBINDING_PROFILE.map(({ key, value }) => [key, value])),
		).toEqual({
			prefix: 'ctrl+b',
			help: '',
			detach: 'prefix+d',
			new_tab: 'prefix+c',
			rename_tab: 'prefix+comma',
			next_tab: 'prefix+n',
			previous_tab: 'prefix+p',
			switch_tab: 'prefix+1..9',
			close_tab: 'prefix+ampersand',
			split_vertical: 'prefix+%',
			split_horizontal: 'prefix+"',
			focus_pane_left: 'prefix+left',
			focus_pane_right: 'prefix+right',
			focus_pane_up: 'prefix+up',
			focus_pane_down: 'prefix+down',
			cycle_pane_next: 'prefix+o',
			last_pane: 'prefix+;',
			close_pane: 'prefix+x',
			zoom: 'prefix+z',
			copy_mode: 'prefix+[',
			workspace_picker: 'prefix+w',
		});
		expect(TOGGLE_ACTION_ID).toBe('oullin.tmux-keybindings.toggle');
	});
});
