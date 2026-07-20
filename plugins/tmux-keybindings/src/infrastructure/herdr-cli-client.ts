import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import { PANE_ENTRYPOINT, PLUGIN_ID } from '#tmux-keybindings/domain/keybinding-profile';
import type { Pane } from '#tmux-keybindings/domain/models';
import { HerdrCliClient as CoreHerdrCliClient } from '@oullin/herdr-plugin-core';

export class HerdrCliClient extends CoreHerdrCliClient implements HerdrClientPort {
	openBindingsPane(targetPaneId: string): Pane {
		return this.openPluginPane({
			pluginId: PLUGIN_ID,
			entrypoint: PANE_ENTRYPOINT,
			targetPaneId,
			placement: 'split',
			direction: 'right',
			focus: false,
		});
	}
}
