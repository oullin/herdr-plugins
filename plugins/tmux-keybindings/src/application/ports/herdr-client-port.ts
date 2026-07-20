import type { Pane } from '#tmux-keybindings/domain/models';
import type { ConfigClient } from '@oullin/herdr-plugin-core';

export interface HerdrClientPort extends ConfigClient {
	getPane(paneId: string): Pane | undefined;
	openBindingsPane(targetPaneId: string): Pane;
	closePluginPane(paneId: string): boolean;
}
