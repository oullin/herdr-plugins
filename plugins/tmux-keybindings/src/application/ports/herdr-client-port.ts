import type { Pane } from '#tmux-keybindings/domain/models';

export interface HerdrClientPort {
	validateConfig(configPath: string): void;
	reloadConfig(): void;
	getPane(paneId: string): Pane | undefined;
	openBindingsPane(targetPaneId: string): Pane;
	closePluginPane(paneId: string): boolean;
}
