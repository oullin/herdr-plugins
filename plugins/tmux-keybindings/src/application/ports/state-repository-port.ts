import type { ConfigurationSnapshot } from '#tmux-keybindings/domain/models';

export interface StateRepositoryPort {
	loadConfigurationSnapshot(configPath: string): ConfigurationSnapshot | undefined;
	saveConfigurationSnapshot(snapshot: ConfigurationSnapshot): void;
	deleteConfigurationSnapshot(configPath: string): void;
	isAutomaticApplyDisabled(): boolean;
	setAutomaticApplyDisabled(disabled: boolean): void;
}
