import type { Environment, KeybindingConfiguration } from '#pane-navigation-hints/domain/models';

export interface KeybindingConfigurationPort {
	read(environment?: Environment): KeybindingConfiguration;
}
