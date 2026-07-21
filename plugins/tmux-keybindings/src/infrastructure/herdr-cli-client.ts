import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import { PANE_ENTRYPOINT, PLUGIN_ID } from '#tmux-keybindings/domain/keybinding-profile';
import { HerdrCliClient as CoreHerdrCliClient } from '@oullin/herdr-plugin-core';

export class HerdrCliClient extends CoreHerdrCliClient implements HerdrClientPort {
	openBindingsPopup(): void {
		this.run(['plugin', 'pane', 'open', '--plugin', PLUGIN_ID, '--entrypoint', PANE_ENTRYPOINT, '--placement', 'popup']);
	}
}
