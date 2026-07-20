import { pathToFileURL } from 'node:url';

import { ConfigurationManager } from '#tmux-keybindings/application/configuration-manager';
import { PanelToggle } from '#tmux-keybindings/application/panel-toggle';
import { ConfigPathResolver } from '#tmux-keybindings/infrastructure/config-path-resolver';
import { HerdrCliClient } from '#tmux-keybindings/infrastructure/herdr-cli-client';
import { JsonStateRepository } from '#tmux-keybindings/infrastructure/json-state-repository';
import { KeybindingConfigEditor } from '#tmux-keybindings/infrastructure/keybinding-config-editor';
import { StateDirectoryResolver } from '#tmux-keybindings/infrastructure/state-directory-resolver';
import { BindingsPanelApplication } from '#tmux-keybindings/presentation/bindings-panel-application';
import { BindingsPanelRenderer } from '#tmux-keybindings/presentation/bindings-panel-renderer';
import { PluginApplication } from '#tmux-keybindings/presentation/plugin-application';

export { type HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
export { type StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
export { ConfigurationManager, type ConfigurationResult } from '#tmux-keybindings/application/configuration-manager';
export { PanelToggle, type ToggleResult } from '#tmux-keybindings/application/panel-toggle';
export * from '#tmux-keybindings/domain/keybinding-profile';
export type * from '#tmux-keybindings/domain/models';
export { PluginError } from '#tmux-keybindings/errors/plugin-error';
export { ConfigPathResolver } from '#tmux-keybindings/infrastructure/config-path-resolver';
export { type CommandResult, type CommandRunner, NodeCommandRunner } from '#tmux-keybindings/infrastructure/command-runner';
export { HerdrCliClient } from '#tmux-keybindings/infrastructure/herdr-cli-client';
export { JsonStateRepository } from '#tmux-keybindings/infrastructure/json-state-repository';
export { KeybindingConfigEditor } from '#tmux-keybindings/infrastructure/keybinding-config-editor';
export { StateDirectoryResolver } from '#tmux-keybindings/infrastructure/state-directory-resolver';
export { BindingsPanelApplication } from '#tmux-keybindings/presentation/bindings-panel-application';
export { BindingsPanelRenderer } from '#tmux-keybindings/presentation/bindings-panel-renderer';
export { PluginApplication } from '#tmux-keybindings/presentation/plugin-application';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const action = process.argv[2];

	if (action === 'bindings') {
		new BindingsPanelApplication(new BindingsPanelRenderer()).run();
	} else {
		const stateDirectory = new StateDirectoryResolver().resolve();
		const state = new JsonStateRepository(stateDirectory);
		const client = new HerdrCliClient();
		const configuration = new ConfigurationManager(client, new KeybindingConfigEditor(), new ConfigPathResolver(), state);
		const toggle = new PanelToggle(client, state);

		new PluginApplication(configuration, toggle).run(action, process.env, process.argv.includes('--automatic'));
	}
}
